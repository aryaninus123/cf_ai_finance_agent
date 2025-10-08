// Receipt Scanner using Cloudflare Workers AI Vision Models
// Supports multi-model fallback and heuristic extraction

interface Env {
  AI: any;
}

interface ScanResult {
  success: boolean;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  note: string;
  model?: string;
  raw_text?: string;
  debug?: any;
  error?: string;
}

export class ReceiptScanner {
  private ai: any;
  private storage: DurableObjectStorage;

  constructor(ai: any, storage: DurableObjectStorage) {
    this.ai = ai;
    this.storage = storage;
  }

  /**
   * Main entry point for receipt scanning
   */
  async scanReceipt(imageDataURL: string): Promise<ScanResult> {
    try {
      // Extract base64 from data URL
      const base64 = this.extractBase64(imageDataURL);
      console.log('📸 Receipt scan request received, image size:', base64.length);

      // Build the extraction prompt
      const prompt = this.buildExtractionPrompt();

      // Ensure Llama license is accepted (one-time)
      await this.ensureLicenseAccepted();

      // Try primary vision model (Llama 3.2 Vision)
      let result = await this.tryPrimaryModel(base64, prompt);
      
      // Parse the AI response
      let extracted = this.parseAIResponse(result);

      // Only use fallback if primary model truly failed (not just insufficient data)
      // Since we fixed the parsing, the primary model should work fine
      if (!extracted.merchant && !extracted.amount && extracted.note.includes('parse')) {
        console.log('🔁 Primary model failed to parse, trying fallback...');
        const fallbackResult = await this.tryFallbackModel(base64, prompt);
        if (fallbackResult) {
          extracted = this.mergeFallbackResults(extracted, fallbackResult);
        }
      } else if (this.isInsufficient(extracted)) {
        console.log('⚠️ Insufficient data extracted, but skipping fallback (primary model worked, data may be unclear in image)');
      }

      // Heuristic extraction as last resort
      if (this.isInsufficient(extracted) && result?.rawText) {
        extracted = this.applyHeuristicExtraction(extracted, result.rawText);
      }

      // Return final result
      return this.buildSuccessResponse(extracted);

    } catch (error: any) {
      console.error('Receipt scan error:', error);
      return this.buildErrorResponse(error);
    }
  }

  /**
   * Extract base64 string from data URL
   */
  private extractBase64(imageDataURL: string): string {
    return (imageDataURL.includes(',') 
      ? imageDataURL.split(',')[1] 
      : imageDataURL
    ).trim();
  }

  /**
   * Build the AI prompt for receipt extraction
   */
  private buildExtractionPrompt(): string {
    return `You are a receipt data extraction expert. Analyze this receipt image carefully and extract key information.

Your task:
1. Find the MERCHANT/STORE NAME (usually at the top, largest text)
2. Find the TOTAL AMOUNT (look for "Total", "Grand Total", "Amount Due" - the final amount paid)
3. Find the DATE (transaction date in any format)
4. Determine the CATEGORY based on the merchant type

Respond with ONLY this JSON format (no markdown, no explanation):
{
  "merchant": "exact store name",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "category": "one of: food, transportation, housing, entertainment, shopping, healthcare, other"
}

Category guidelines:
- food: restaurants, groceries, cafes, food delivery
- transportation: gas stations, uber, parking, auto services
- shopping: retail stores, clothing, electronics, general merchandise
- entertainment: movies, games, subscriptions, events
- healthcare: pharmacy, medical, gym, health services
- housing: rent, utilities, home improvement
- other: anything else

If date is unclear, use: ${new Date().toISOString().slice(0,10)}
If amount is unclear, estimate from visible numbers.

RESPOND WITH ONLY THE JSON OBJECT.`;
  }

  /**
   * Ensure Llama license is accepted (one-time operation)
   */
  private async ensureLicenseAccepted(): Promise<void> {
    const agreed = await this.storage.get('llama_agreed');
    if (!agreed) {
      try {
        console.log('Accepting Llama license...');
        await this.ai.run('@cf/meta/llama-3.2-11b-vision-instruct', {
          prompt: 'agree',
          max_tokens: 10
        });
        await this.storage.put('llama_agreed', true);
        console.log('✅ Llama license accepted');
      } catch (e) {
        console.warn('⚠️ License agreement step failed (may already be accepted):', e);
      }
    }
  }

  /**
   * Try primary vision model (Llama 3.2 11B Vision)
   */
  private async tryPrimaryModel(base64: string, prompt: string): Promise<any> {
    try {
      console.log('🤖 Calling Llama 3.2 Vision model...');
      
      const result = await Promise.race([
        this.ai.run('@cf/meta/llama-3.2-11b-vision-instruct', {
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
              ]
            }
          ],
          max_tokens: 512
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI request timed out after 45 seconds')), 45000)
        )
      ]) as any;

      console.log('✅ AI response received:', JSON.stringify(result).substring(0, 200));
      
      // Set rawText properly based on response type
      let rawText = '';
      if (typeof result?.response === 'object') {
        rawText = JSON.stringify(result.response);
      } else if (result?.response) {
        rawText = result.response.toString();
      }
      
      return { response: result?.response, rawText };

    } catch (aiError: any) {
      console.error('Primary AI model error:', aiError);
      throw new Error('AI service temporarily unavailable');
    }
  }

  /**
   * Try fallback vision model (LLaVA 1.5 7B)
   */
  private async tryFallbackModel(base64: string, prompt: string): Promise<any> {
    try {
      const fallback = await this.ai.run('@cf/llava-v1.5-7b', {
        prompt,
        image: `data:image/jpeg;base64,${base64}`,
        max_tokens: 512
      }) as any;

      if (fallback?.response) {
        return {
          response: fallback.response,
          model: '@cf/llava-v1.5-7b',
          note: 'parsed_successfully_fallback_json'
        };
      }
      return null;
    } catch (e) {
      console.warn('Fallback model failed:', e);
      return null;
    }
  }

  /**
   * Parse AI response and extract structured data
   */
  private parseAIResponse(result: any): any {
    const extracted = {
      merchant: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      category: 'other',
      note: '',
      model: '@cf/meta/llama-3.2-11b-vision-instruct',
      rawText: ''
    };

    const response = result?.response;
    
    if (!response) {
      extracted.note = 'no_response_from_model';
      return extracted;
    }

    try {
      let parsed;
      
      // CASE 1: Response is already a JSON object (Cloudflare Vision returns this directly)
      if (typeof response === 'object' && !Array.isArray(response)) {
        console.log('✅ Response is already an object:', JSON.stringify(response));
        parsed = response;
        extracted.rawText = JSON.stringify(response);
        extracted.note = 'Parsed successfully (direct object)';
      } 
      // CASE 2: Response is a string that needs parsing
      else {
        const rawText = response.toString();
        extracted.rawText = rawText;
        
        // Remove markdown code blocks if present
        let jsonStr = rawText.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        // Try to extract JSON object from response
        const jsonMatch = jsonStr.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
          extracted.note = 'Parsed successfully (from string)';
        } else {
          extracted.note = 'No JSON object found in response';
          return extracted;
        }
      }

      // Extract data from parsed object
      if (parsed) {
        extracted.merchant = (parsed.merchant || '').toString().trim();
        extracted.amount = parseFloat(parsed.amount) || 0;
        extracted.date = parsed.date || extracted.date;
        extracted.category = parsed.category || 'other';
        
        console.log('✅ Extracted data:', { merchant: extracted.merchant, amount: extracted.amount, category: extracted.category });
      }
    } catch (e) {
      console.warn('JSON parse failed:', e);
      extracted.note = 'json_parse_failed: ' + (e as Error).message;
    }

    return extracted;
  }

  /**
   * Check if extracted data is insufficient (needs fallback)
   */
  private isInsufficient(extracted: any): boolean {
    return !extracted.merchant || extracted.amount <= 0;
  }

  /**
   * Merge results from fallback model
   */
  private mergeFallbackResults(primary: any, fallback: any): any {
    try {
      let jsonStr = fallback.response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const match = jsonStr.match(/\{[\s\S]*?\}/);
      
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          merchant: primary.merchant || (parsed.merchant || '').toString().trim(),
          amount: primary.amount > 0 ? primary.amount : (parseFloat(parsed.amount) || 0),
          date: parsed.date || primary.date,
          category: parsed.category || primary.category,
          note: fallback.note || 'parsed_successfully_fallback',
          model: fallback.model,
          rawText: fallback.response
        };
      }
    } catch (e) {
      console.warn('Failed to merge fallback results:', e);
    }
    
    primary.note = primary.note || 'fallback_failure';
    return primary;
  }

  /**
   * Apply heuristic extraction (regex patterns) as last resort
   */
  private applyHeuristicExtraction(extracted: any, rawText: string): any {
    try {
      const text = rawText.replace(/\s+/g, ' ').trim();

      // Extract amount using regex patterns
      if (extracted.amount <= 0) {
        extracted.amount = this.extractAmount(text);
      }

      // Extract merchant name
      if (!extracted.merchant) {
        extracted.merchant = this.extractMerchant(rawText);
      }

      if (!extracted.note || extracted.note.startsWith('json_') || extracted.note.startsWith('no_')) {
        extracted.note = 'heuristic_extraction';
      }
    } catch (e) {
      console.warn('Heuristic extraction failed:', e);
    }

    return extracted;
  }

  /**
   * Extract amount using regex heuristics
   */
  private extractAmount(text: string): number {
    // Try to find labeled totals first (higher priority)
    const totalRegex = /(receipt\s*total|grand\s*total|amount\s*due|total)\s*[:\-]?\s*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/i;
    const totalMatch = text.match(totalRegex);
    
    if (totalMatch && !isNaN(parseFloat(totalMatch[2].replace(/,/g, '')))) {
      return parseFloat(totalMatch[2].replace(/,/g, ''));
    }

    // Fallback: find all money amounts and take the largest
    const moneyMatches = [...text.matchAll(/\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2}))/g)]
      .map(match => parseFloat(match[1].replace(/,/g, '')))
      .filter(n => !isNaN(n));

    return moneyMatches.length > 0 ? Math.max(...moneyMatches) : 0;
  }

  /**
   * Extract merchant name from first few lines
   */
  private extractMerchant(rawText: string): string {
    const lines = rawText.split(/\n|\\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => Boolean(l));

    // Skip lines with common receipt keywords
    const stopWords = /(receipt|bill\s*to|ship\s*to|date|qty|description|amount|unit\s*price|payment|instruction|terms|conditions)/i;
    
    const candidate = lines.find((l: string) => 
      /[A-Z]/.test(l) && 
      !stopWords.test(l) && 
      l.length <= 40 && 
      l.length >= 3
    );

    return candidate 
      ? candidate.replace(/[^A-Za-z0-9 .,&'-]/g, '').trim() 
      : '';
  }

  /**
   * Build success response with all extracted data
   */
  private buildSuccessResponse(extracted: any): ScanResult {
    const success = extracted.amount > 0 && extracted.merchant && extracted.merchant.length > 1;

    return {
      success,
      merchant: extracted.merchant,
      amount: extracted.amount,
      date: extracted.date,
      category: extracted.category,
      note: extracted.note,
      model: extracted.model,
      raw_text: extracted.rawText,
      debug: {
        model: extracted.model,
        note: extracted.note,
        hadJson: /\{[\s\S]*?\}/.test(extracted.rawText || ''),
        responseSnippet: extracted.rawText ? extracted.rawText.substring(0, 350) : ''
      }
    };
  }

  /**
   * Build error response
   */
  private buildErrorResponse(error: any): ScanResult {
    return {
      success: false,
      merchant: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      category: 'other',
      note: 'AI vision model failed. Please enter transaction details manually.',
      error: error?.message || 'Unknown error'
    };
  }
}

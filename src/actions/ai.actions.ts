'use server';

import { AIService } from '@/services/ai.service';
import { withActionHandler } from '@/lib/action-handler';

export async function parseTransactionMessageAction(message: string) {
  return withActionHandler(() => AIService.parseTextToTransaction(message));
}

export async function parseTransactionImageAction(
  imageData: string, // base64 encoded image data
  mediaType: string = 'image/jpeg'
) {
  return withActionHandler(() => 
    AIService.parseImageToTransaction(imageData, mediaType)
  );
}

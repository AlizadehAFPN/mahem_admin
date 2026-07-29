// What a *good* image for a particular upload field looks like. Purely
// advisory: every rule here produces a warning and nothing more, because the
// admin is the one who can see the photo and may have a reason we don't know
// about. Plain data rather than a validator function on purpose — these
// descriptions are built in server components, and only serializable props
// cross that boundary.
export interface ImageAdvice {
  // Warn unless height/width falls inside this band. A phone screen is
  // roughly 16:9 to 20:9 tall, i.e. 1.78–2.22.
  aspectRatio?: { min: number; max: number };
  // Warn below this pixel width — a full-screen image is stretched to fill,
  // so an undersized one arrives visibly soft.
  minWidth?: number;
  // Warn above this file size. Not a limit, a download-speed preference.
  preferredMaxBytes?: number;
  preferredMimeType?: string;
  preferredFormatLabel?: string;
}

export interface InspectedImage {
  byteSize: number;
  mimeType: string;
  // Absent when the browser couldn't decode the file (a PDF renamed .jpg, a
  // corrupt upload) — the shape-based advice is then skipped rather than the
  // whole check failing.
  width?: number;
  height?: number;
}

export function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} کیلوبایت`
    : `${(bytes / 1024 / 1024).toFixed(1)} مگابایت`;
}

export function imageWarnings(image: InspectedImage, advice: ImageAdvice): string[] {
  const warnings: string[] = [];
  const hasSize = typeof image.width === 'number' && typeof image.height === 'number';

  if (hasSize && advice.aspectRatio) {
    const width = image.width!;
    const height = image.height!;
    const ratio = height / width;
    if (ratio <= 1) {
      warnings.push(
        `این تصویر ${width}×${height} است، یعنی افقی یا مربع. تصویر اسپلش باید عمودی و به نسبت صفحه گوشی موبایل باشد، وگرنه روی گوشی بریده می‌شود.`,
      );
    } else if (ratio < advice.aspectRatio.min || ratio > advice.aspectRatio.max) {
      warnings.push(
        `نسبت طول به عرض این تصویر (${width}×${height}) با صفحه گوشی جور نیست. تصویر روی کل صفحه کشیده می‌شود و بخشی از آن بریده خواهد شد.`,
      );
    }
  }

  if (hasSize && advice.minWidth && image.width! < advice.minWidth) {
    warnings.push(
      `عرض این تصویر ${image.width} پیکسل است که برای نمایش تمام‌صفحه کم است و روی گوشی تار دیده می‌شود. حداقل ${advice.minWidth} پیکسل پیشنهاد می‌شود.`,
    );
  }

  if (advice.preferredMaxBytes && image.byteSize > advice.preferredMaxBytes) {
    warnings.push(
      `حجم این تصویر ${formatSize(image.byteSize)} است. ترجیحاً کمتر از ${formatSize(
        advice.preferredMaxBytes,
      )} باشد تا روی اینترنت موبایل سریع لود شود.`,
    );
  }

  // An empty mimeType means the browser couldn't tell — no point guessing at
  // the format in that case.
  if (advice.preferredMimeType && image.mimeType && image.mimeType !== advice.preferredMimeType) {
    const label = advice.preferredFormatLabel ?? 'پیشنهادی';
    warnings.push(
      `فرمت این فایل ${label} نیست. فرمت ${label} سازگارتر با موبایل است و معمولاً حجم کمتری هم دارد.`,
    );
  }

  return warnings;
}

import { message } from "antd";
import { formulaStore } from "../../state/formula";

/**
 * Preprocesses HTML to include formula values for RTF export
 * @param html The HTML content to process
 * @returns The processed HTML with formula values
 */
const preprocessHtmlForExport = (html: string): string => {
  try {
    // Create a temporary DOM element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    
    // Get all formula elements
    const formulaElements = tempElement.querySelectorAll('formula');
    const allFormulas = formulaStore.getState();
    
    // Process each formula element to include its calculated value
    formulaElements.forEach(element => {
      const id = element.getAttribute('id');
      if (id) {
        const formula = allFormulas.find(f => f.id === id);
        if (formula && formula.data) {
          // Get current text content
          const currentText = element.textContent || '';
          
          // Replace the formula element with a span that contains both parts
          // Using non-breaking space (\u00A0) to force them to stay on same line in RTF
          const span = document.createElement('span');
          span.innerHTML = `${currentText} ${formula.data}`;
          
          // Replace the formula element with our new span
          if (element.parentNode) {
            element.parentNode.replaceChild(span, element);
          }
        }
      }
    });
    
    return tempElement.innerHTML;
  } catch (error) {
    console.error("Error preprocessing HTML:", error);
    return html; // Return original HTML if preprocessing fails
  }
};

/**
 * Wraps any inline background-color (on any tag) into [[BG:…]] markers,
 * and converts every plain-space in text nodes to &nbsp; so spaces survive.
 */
function preProcessHtml(html: string): string {
  const START = "[[BG:";
  const END   = "]]";

  // 1) Turn all spaces in text nodes into &nbsp;
  const parts = html.split(/(<[^>]+>)/g);
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i].startsWith("<")) {
      parts[i] = parts[i].replace(/ /g, "&nbsp;");
    }
  }
  let out = parts.join("");

  // 2) For ANY tag with inline background-color, lift it into markers:
  out = out.replace(
    /<([a-z0-9]+)([^>]*?)\sstyle="([^"]*?)background-color\s*:\s*([^;"']+)[^"]*"([^>]*)>([\s\S]*?)<\/\1>/gi,
    (_, tag, beforeAttrs, styles, color, afterAttrs, innerHTML) => {
      // strip only the bg rule from the style
      const cleaned = styles
        .split(";")
        .filter((s: string) => !/background-color/i.test(s))
        .join(";");
      const styleAttr = cleaned.trim() ? ` style="${cleaned}"` : "";
      // wrap the inner HTML in our markers
      return `<${tag}${beforeAttrs}${styleAttr}${afterAttrs}>`
           + `${START}${color.trim()}${END}`
           + innerHTML
           + `${START}END${END}`
           + `</${tag}>`;
    }
  );

  // 3) Strip any leftover <mark> tags (we handle their backgrounds above)
  out = out.replace(/<\/?mark\b[^>]*>/gi, "");

  return out;
}

/**
 * Injects the [[BG:…]] markers back into real RTF highlight runs.
 */
function postProcessRtf(rtf: string): string {
  // 1) Gather unique colors from [[BG:…]] tags
  const colorSet = new Set<string>();
  const tagRe = /\[\[BG:([^\]]+)\]\]/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(rtf))) {
    if (m[1] !== "END") colorSet.add(m[1]);
  }
  const colors = Array.from(colorSet);
  if (colors.length === 0) return rtf;

  // 2) Expand or create the RTF color table
  let originalCount = 0;
  let injected = false;

  const entries = colors
    .map(hex => {
      const clean = hex.replace(/^#/, "");
      const [r, g, b] = clean.match(/.{2}/g)!.map(h => parseInt(h, 16));
      return `\\red${r}\\green${g}\\blue${b};`;
    })
    .join("");
  // Try updating existing \colortbl
  rtf = rtf.replace(
    /\\colortbl;([^}]*)}/,
    (_full, existing) => {
      originalCount = (existing.match(/;/g) || []).length;
      injected = true;
      return `\\colortbl;${existing}${entries}}`;
    }
  );

  // If no existing color table, insert a new one after the header
  if (!injected) {
    // Find the start of the fonttbl group
    const fontStart = rtf.indexOf('{\\fonttbl');
    if (fontStart !== -1) {
      // Walk the string to find the matching closing '}' for fonttbl
      let depth = 0;
      let pos = fontStart;
      for (; pos < rtf.length; pos++) {
        if (rtf[pos] === '{') depth++;
        else if (rtf[pos] === '}') {
          depth--;
          if (depth === 0) {
            pos++; // include the closing brace itself
            break;
          }
        }
      }
      // Insert the new color table immediately after fonttbl group
      rtf = rtf.slice(0, pos) + `{\\colortbl;${entries}}` + rtf.slice(pos);
    }
  }

  // 4) Replace each [[BG:color]]…[[BG:END]] with \highlightN … \highlight0
  colors.forEach((hex, idx) => {
    const colorIndex = originalCount + idx + 1;
    const safeHex = hex.replace(/[#]/g, "\\$&");
    const runRe = new RegExp(
      `\\[\\[BG:${safeHex}\\]\\]([\\s\\S]*?)\\[\\[BG:END\\]\\]`,
      "g"
    );
    rtf = rtf.replace(runRe, `\\highlight${colorIndex} $1\\highlight0`);
  });

  return rtf;
}

/**
 * Exports HTML content to RTF format
 * @param html The HTML content to convert to RTF
 * @returns Promise that resolves to a boolean indicating success or failure
 */
export const exportToRTF = async (html: string): Promise<boolean> => {
  try {
    // Preprocess HTML to include formula values
    let processedHtml = preprocessHtmlForExport(html);

    processedHtml = preProcessHtml(processedHtml);

    // Dynamically import the html-to-rtf-browser library
    const HtmlToRtfBrowserModule = await import("html-to-rtf-browser");
    const HtmlToRtfBrowser = HtmlToRtfBrowserModule.default;
    const htmlToRtf = new HtmlToRtfBrowser();

    // Convert HTML to RTF
    let rtf = htmlToRtf.convertHtmlToRtf(processedHtml);
    
    rtf = postProcessRtf(rtf);

    // Create a Blob from the RTF content
    const blob = new Blob([rtf], { type: "application/rtf;charset=utf-8" });

    // Create a download link and trigger download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "document.rtf";

    // Add the link to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 100);

    return true;
  } catch (error) {
    console.error("Error exporting to RTF:", error);
    message.error("Failed to export document to RTF format");
    return false;
  }
};

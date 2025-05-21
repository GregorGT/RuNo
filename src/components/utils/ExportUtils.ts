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
 * Exports HTML content to RTF format
 * @param html The HTML content to convert to RTF
 * @returns Promise that resolves to a boolean indicating success or failure
 */
export const exportToRTF = async (html: string): Promise<boolean> => {
  try {
    // Preprocess HTML to include formula values
    let processedHtml = preprocessHtmlForExport(html);

    const START = "[[BG:";
    const END   = "]]";
    
    // 1) Pre-process HTML: wrap every element with inline bg-color
    processedHtml = processedHtml.replace(
      /<([a-z]+)([^>]*)\sstyle="([^"]*?)background-color:\s*([^;"']+)[^"]*"([^>]*)>([^<]*)<\/\1>/gi,
      (m: string, tag: string, before: string, styles: string, color: string, after: string, innerText: string) => {
        // strip out only the bg rule
        const cleanStyles = styles
          .split(";")
          .filter((s: string) => !/background-color/i.test(s))
          .join(";");
        const styleAttr = cleanStyles ? ` style="${cleanStyles}"` : "";
        // wrap the inner text with markers
        return `<${tag}${before}${styleAttr}${after}>` +
               `${START}${color}${END}` +
               innerText +
               `${START}END${END}` +
               `</${tag}>`;
      }
    );

    // Dynamically import the html-to-rtf-browser library
    const HtmlToRtfBrowserModule = await import("html-to-rtf-browser");
    const HtmlToRtfBrowser = HtmlToRtfBrowserModule.default;
    const htmlToRtf = new HtmlToRtfBrowser();

    // Convert HTML to RTF
    let rtf = htmlToRtf.convertHtmlToRtf(processedHtml);
    // 2. Gather all the colors you marked in the RTF
    //    We used "[[BG:COLOR]]" and "[[BG:END]]" markers in the HTML pre-processor.

    const colorRegex = /\[\[BG:([^\]]+)\]\]/g;
    const colors: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = colorRegex.exec(rtf)) !== null) {
      const c = m[1];
      if (c !== "END" && !colors.includes(c)) {
        colors.push(c);
      }
    }

    // 3. Inject those colors into the RTF color table
    rtf = rtf.replace(
      /\\colortbl;([^}]*)}/,
      (full: string, existing: string) => {
        const entries = colors.map(c => {
          // strip leading "#" if present, parse hex
          const hex = c.replace(/^#/, "");
          const [r, g, b] = hex.match(/.{2}/g)?.map((h: string) => parseInt(h, 16)) || [0, 0, 0];
          return `\\red${r}\\green${g}\\blue${b};`;
        }).join("");
        return `\\colortbl;${existing}${entries}}`;
      }
    );

    // 4. Wrap each marked run in \highlight…\highlight0
    colors.forEach((c, idx) => {
      // RTF color-table indices start at 1 (0 is default)
      const colorIndex = /* count your original colors */ 1 + idx;
      // build a regex to find the run between [[BG:C]] and [[BG:END]]
      const runRegex = new RegExp(
        `\\[\\[BG:${c}\\]\\]([\\s\\S]*?)\\[\\[BG:END\\]\\]`,
        "g"
      );
      rtf = rtf.replace(
        runRegex,
        `\\highlight${colorIndex} $1\\highlight0`
      );
    });

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
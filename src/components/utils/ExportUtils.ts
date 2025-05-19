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
          // Add a space and the formula value after the formula content
          const textValue = ` ${formula.data}`;
          element.textContent = (element.textContent || '') + textValue;
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
    const processedHtml = preprocessHtmlForExport(html);
    
    // Dynamically import the html-to-rtf-browser library
    const HtmlToRtfBrowserModule = await import('html-to-rtf-browser');
    const HtmlToRtfBrowser = HtmlToRtfBrowserModule.default;
    const htmlToRtf = new HtmlToRtfBrowser();
    
    // Convert HTML to RTF
    const rtf = htmlToRtf.convertHtmlToRtf(processedHtml);
    
    // Create a Blob from the RTF content
    const blob = new Blob([rtf], { type: "application/rtf;charset=utf-8" });
    
    // Create a download link and trigger download
    const link = document.createElement('a');
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
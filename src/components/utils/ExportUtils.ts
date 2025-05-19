import { message } from "antd";

/**
 * Exports HTML content to RTF format
 * @param html The HTML content to convert to RTF
 * @returns Promise that resolves to a boolean indicating success or failure
 */
export const exportToRTF = async (html: string): Promise<boolean> => {
  try {
    // Dynamically import the html-to-rtf-browser library
    const HtmlToRtfBrowserModule = await import('html-to-rtf-browser');
    const HtmlToRtfBrowser = HtmlToRtfBrowserModule.default;
    const htmlToRtf = new HtmlToRtfBrowser();
    
    // Convert HTML to RTF
    const rtf = htmlToRtf.convertHtmlToRtf(html);
    
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
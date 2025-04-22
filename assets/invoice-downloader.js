/**
 * Invoice Downloader
 * 
 * This script handles the direct download of order invoices without opening a new tab.
 * It fetches the invoice HTML and triggers a download using a Blob.
 */
class InvoiceDownloader {
  constructor() {
    this.initEventListeners();
  }

  initEventListeners() {
    // Find all invoice download buttons
    const invoiceButtons = document.querySelectorAll('.btn-invoice');
    
    // Add click event listener to each button
    invoiceButtons.forEach(button => {
      button.addEventListener('click', this.handleInvoiceDownload.bind(this));
    });
  }

  async handleInvoiceDownload(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const invoiceUrl = button.getAttribute('href');
    const orderId = this.extractOrderId(invoiceUrl);
    
    if (!invoiceUrl) {
      console.error('Invoice URL not found');
      return;
    }
    
    // Show loading state
    button.classList.add('loading');
    
    try {
      // Fetch the invoice HTML
      const response = await fetch(invoiceUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch invoice: ${response.status} ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Create a blob from the HTML
      const blob = new Blob([html], { type: 'text/html' });
      
      // Create a temporary link and trigger download
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `invoice-${orderId}.html`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(downloadLink.href);
        document.body.removeChild(downloadLink);
      }, 100);
      
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      // Remove loading state
      button.classList.remove('loading');
    }
  }
  
  extractOrderId(url) {
    // Extract order ID from URL like /account/orders/1234567890?view=invoice
    const match = url.match(/\/orders\/(\d+)/);
    return match ? match[1] : 'order';
  }
}

// Initialize the downloader when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new InvoiceDownloader();
});

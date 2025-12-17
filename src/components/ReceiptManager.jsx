import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Link as LinkIcon,
  Folder,
  Grid,
  List,
  Search,
  Filter,
  MoreVertical,
  Check,
  AlertCircle,
  Database,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import Toast from './Toast'; // Add this import

// Store files in memory (outside of React state)
let fileStorage = new Map(); // Map<receiptId, file>

const ReceiptManager = ({ accountId }) => {
  const { accounts, getAccountById, addReceipt, deleteReceipt, linkReceiptToTransaction, 
          FILE_SIZE_LIMITS, calculateTotalStorageUsed, TOTAL_STORAGE_LIMIT } = useTransactions();
  const account = getAccountById(accountId);
  const fileInputRef = useRef(null);
  
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [receiptToLink, setReceiptToLink] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [toasts, setToasts] = useState([]); // Add toasts state

  if (!account) return null;

  // Ensure receipts array exists
  const receipts = account.receipts || [];
  
  // Add a toast message
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  };

  // Remove a toast
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
    return 'document';
  };

  const getFileSizeLimit = (type) => {
    const limit = FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.default;
    return `${limit / (1024 * 1024)}MB`;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Show toast for starting upload
    const startToastId = addToast(`Starting upload of ${files.length} file(s)...`, 'info');
    
    // Validate files before uploading
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      const type = getFileType(file);
      const limit = FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.default;
      
      if (file.size > limit) {
        invalidFiles.push({
          name: file.name,
          size: formatFileSize(file.size),
          limit: getFileSizeLimit(type)
        });
      } else {
        validFiles.push(file);
      }
    });
    
    if (invalidFiles.length > 0) {
      setUploadError({
        title: 'File Too Large',
        message: `The following files exceed size limits:`,
        files: invalidFiles
      });
      
      if (validFiles.length === 0) {
        fileInputRef.current.value = '';
        removeToast(startToastId);
        addToast('No valid files to upload', 'warning');
        return;
      }
    }
    
    if (validFiles.length === 0) return;
    
    setUploading(true);
    setUploadError(null);
    
    try {
      // Show upload queue
      setUploadQueue(validFiles.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        progress: 0,
        status: 'uploading',
        type: getFileType(file),
        size: formatFileSize(file.size)
      })));
      
      let completedCount = 0;
      let successCount = 0;
      let errorCount = 0;
      
      for (const file of validFiles) {
        const fileType = getFileType(file);
        
        try {
          const receiptData = {
            name: file.name,
            type: fileType,
            size: formatFileSize(file.size),
            date: new Date().toISOString().split('T')[0],
            transactionId: null,
            file: file // Pass file object
          };

          await addReceipt(accountId, receiptData);
          
          // Store the file in memory for this session
          const newReceipt = account.receipts?.[account.receipts.length - 1];
          if (newReceipt) {
            fileStorage.set(newReceipt.id, file);
          }
          
          // Update upload queue
          setUploadQueue(prev => prev.map(item => 
            item.name === file.name 
              ? { ...item, progress: 100, status: 'completed' }
              : item
          ));
          
          completedCount++;
          successCount++;
          
          // Show success toast for each file
          addToast(`"${file.name}" uploaded successfully!`, 'success');
          
        } catch (error) {
          console.error('Error uploading file:', file.name, error);
          
          // Update upload queue with error
          setUploadQueue(prev => prev.map(item => 
            item.name === file.name 
              ? { ...item, progress: 0, status: 'error', error: error.message }
              : item
          ));
          
          completedCount++;
          errorCount++;
          
          // Show error toast
          addToast(`Failed to upload "${file.name}": ${error.message}`, 'error');
        }
        
        // Simulate progress for remaining files
        const remainingFiles = validFiles.slice(completedCount);
        remainingFiles.forEach(remainingFile => {
          setTimeout(() => {
            setUploadQueue(prev => prev.map(item => 
              item.name === remainingFile.name 
                ? { ...item, progress: Math.min(item.progress + 25, 90) }
                : item
            ));
          }, 100);
        });
      }
      
      // Clear upload queue after delay
      setTimeout(() => {
        setUploadQueue([]);
      }, 2000);
      
      // Show summary toast
      if (successCount > 0) {
        addToast(`Upload complete! ${successCount} file(s) uploaded successfully.`, 'success');
      }
      if (errorCount > 0) {
        addToast(`${errorCount} file(s) failed to upload.`, 'error');
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError({
        title: 'Upload Error',
        message: error.message || 'Error uploading files. Please try again.'
      });
      addToast('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      removeToast(startToastId);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="text-blue-500" size={20} />;
      case 'pdf':
        return <FileText className="text-red-500" size={20} />;
      default:
        return <File className="text-gray-500" size={20} />;
    }
  };

const handlePreview = (receipt) => {
  // Check if file is stored in memory
  const file = fileStorage.get(receipt.id);
  
  if (file) {
    addToast(`Opening preview for "${receipt.name}"`, 'info');
    
    // Create a blob URL for the file
    const fileURL = URL.createObjectURL(file);
    
    // Open in new window
    const newWindow = window.open();
    if (!newWindow) {
      addToast('Please allow popups to preview files', 'warning');
      return;
    }
    
    // Write HTML to new window
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${receipt.name} - Preview</title>
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .header { 
            background: white; 
            padding: 20px; 
            margin-bottom: 20px; 
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          img { 
            max-width: 100%; 
            max-height: 80vh;
            height: auto; 
            display: block; 
            margin: 0 auto;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .controls {
            margin-top: 20px;
            text-align: center;
          }
          .download-btn {
            display: inline-block;
            padding: 10px 20px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 10px;
          }
          .download-btn:hover {
            background: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0 0 10px 0;">${receipt.name}</h2>
            <p style="margin: 0; color: #666;">
              Type: ${receipt.type} | Size: ${receipt.size} | Date: ${receipt.date}
            </p>
          </div>
          ${receipt.type === 'image' 
            ? `<img src="${fileURL}" alt="${receipt.name}" onload="URL.revokeObjectURL(this.src)" />` 
            : receipt.type === 'pdf'
            ? `<iframe src="${fileURL}" style="width: 100%; height: 80vh; border: none; border-radius: 8px;"></iframe>`
            : `<div style="text-align: center; padding: 40px; background: white; border-radius: 8px;">
                <h3>${receipt.name}</h3>
                <p>File type: ${receipt.type}</p>
                <p>Size: ${receipt.size}</p>
                <p>Date: ${receipt.date}</p>
                <div class="controls">
                  <a href="${fileURL}" download="${receipt.name}" class="download-btn">Download File</a>
                </div>
               </div>`}
          <div class="controls">
            <a href="${fileURL}" download="${receipt.name}" class="download-btn">Download File</a>
          </div>
        </div>
      </body>
      </html>
    `);
    
    // Close the document
    newWindow.document.close();
    
    // Revoke the object URL after a delay to ensure the window has loaded it
    setTimeout(() => {
      URL.revokeObjectURL(fileURL);
    }, 10000); // 10 seconds delay
    
  } else {
    // File not in memory
    if (receipt.thumbnail) {
      addToast(`Showing thumbnail for "${receipt.name}" (original file not in memory)`, 'info');
      
      const newWindow = window.open();
      if (!newWindow) {
        addToast('Please allow popups to preview files', 'warning');
        return;
      }
      
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${receipt.name} - Thumbnail Preview</title>
          <style>
            body { 
              margin: 0; 
              padding: 40px; 
              background: #f5f5f5; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              padding: 30px; 
              border-radius: 8px;
              text-align: center;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .thumbnail { 
              max-width: 300px; 
              margin: 0 auto 20px; 
            }
            img { 
              max-width: 100%; 
              height: auto;
              border-radius: 8px;
            }
            .note {
              color: #666;
              font-size: 14px;
              line-height: 1.5;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 style="margin: 0 0 10px 0;">${receipt.name}</h2>
            <p style="margin: 0 0 20px 0; color: #666;">
              Type: ${receipt.type} | Size: ${receipt.size} | Date: ${receipt.date}
            </p>
            <div class="thumbnail">
              <img src="${receipt.thumbnail}" alt="Thumbnail" />
            </div>
            <div class="note">
              <p><strong>Note:</strong> Original file is only stored in memory during this browser session.</p>
              <p>Page refresh will clear the file data, but this thumbnail remains.</p>
              <p style="color: #ef4444; font-weight: 500;">
                To access the full file, please re-upload it during this session.
              </p>
            </div>
          </div>
        </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      addToast(`"${receipt.name}" is not available for preview. Files are only stored in memory during this session.`, 'warning');
    }
  }
};

const handleDownload = (receipt) => {
  const file = fileStorage.get(receipt.id);

  if (!file) {
    addToast(
      `"${receipt.name}" is not available. Files exist only during this session.`,
      "warning"
    );
    return;
  }

  try {
    const blobUrl = URL.createObjectURL(file);

    const link = document.createElement("a");
    link.href = blobUrl;

    // sanitize filename
    link.download = receipt.name.replace(/[<>:"/\\|?*]+/g, "_");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(`"${receipt.name}" download started`, "success");

    // revoke later (important)
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 10000);

  } catch (err) {
    console.error(err);
    addToast("Download failed", "error");
  }
};

  const handleDeleteReceipt = (receiptId) => {
    const receipt = receipts.find(r => r.id === receiptId);
    if (receipt && window.confirm(`Are you sure you want to delete "${receipt.name}"?`)) {
      // Remove from memory storage
      fileStorage.delete(receiptId);
      deleteReceipt(accountId, receiptId);
      setSelectedReceipts(prev => prev.filter(id => id !== receiptId));
      addToast(`"${receipt.name}" deleted successfully`, 'success');
    }
  };

  const handleLinkToTransaction = (receipt) => {
    setReceiptToLink(receipt);
    setShowLinkModal(true);
    addToast(`Linking "${receipt.name}" to a transaction`, 'info');
  };

  const confirmLinkTransaction = () => {
    if (receiptToLink && selectedTransaction) {
      linkReceiptToTransaction(accountId, receiptToLink.id, selectedTransaction);
      setShowLinkModal(false);
      addToast(`"${receiptToLink.name}" linked to transaction successfully`, 'success');
      setReceiptToLink(null);
      setSelectedTransaction('');
    }
  };

  const getTransactionDescription = (transactionId) => {
    const transaction = account.transactions.find(t => t.id === transactionId);
    if (!transaction) return 'No transaction';
    return `${transaction.type === 'in' ? '+' : '-'}$${transaction.amount.toFixed(2)} on ${transaction.date}`;
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (receipt.type && receipt.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const linkedReceipts = filteredReceipts.filter(r => r.transactionId);
  const unlinkedReceipts = filteredReceipts.filter(r => !r.transactionId);

  const toggleSelectReceipt = (receiptId) => {
    setSelectedReceipts(prev =>
      prev.includes(receiptId)
        ? prev.filter(id => id !== receiptId)
        : [...prev, receiptId]
    );
  };

  const handleBulkDelete = () => {
    if (selectedReceipts.length === 0) return;
    const receiptNames = selectedReceipts.map(id => {
      const receipt = receipts.find(r => r.id === id);
      return receipt?.name || 'Unknown';
    }).join(', ');
    
    if (window.confirm(`Delete ${selectedReceipts.length} selected receipt(s)?\n\n${receiptNames}`)) {
      selectedReceipts.forEach(receiptId => {
        fileStorage.delete(receiptId);
        deleteReceipt(accountId, receiptId);
      });
      setSelectedReceipts([]);
      addToast(`Deleted ${selectedReceipts.length} file(s) successfully`, 'success');
    }
  };

  // Calculate storage usage
  const totalStorageUsed = calculateTotalStorageUsed();
  const storagePercentage = (totalStorageUsed / TOTAL_STORAGE_LIMIT) * 100;
  const remainingStorage = TOTAL_STORAGE_LIMIT - totalStorageUsed;

  // Calculate files in memory
  const filesInMemory = Array.from(fileStorage.keys()).length;

  
  return (
    <div className="mt-8 bg-white rounded-lg shadow border border-gray-200">
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.type === 'error' ? 5000 : 3000}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Error Modal */}
      {uploadError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{uploadError.title}</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-3">{uploadError.message}</p>
                
                {uploadError.files && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <ul className="space-y-2">
                      {uploadError.files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{file.name}</span>
                          <span className="text-red-600">
                            {file.size} (max: {file.limit})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setUploadError(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Folder className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold">Receipts & Documents</h3>
              <div className="flex gap-2">
                <span className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded-full">
                  {receipts.length} files
                </span>
                <span className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full">
                  {filesInMemory} in memory
                </span>
              </div>
            </div>
            
            {selectedReceipts.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm font-medium text-gray-600">
                  {selectedReceipts.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search receipts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
                title="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-600'}`}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>
            
            <div className="relative">
<button
  onClick={() => fileInputRef.current?.click()}
  disabled={uploading}
  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer ${
    uploading 
      ? 'bg-blue-400 cursor-not-allowed' 
      : 'bg-blue-600 hover:bg-blue-700'
  } text-white`}
>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload
                  </>
                )}
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                className="hidden"
              />
            </div>
          </div>
        </div>
        
        {/* Storage Usage Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database size={14} />
              <span>Storage: {formatFileSize(totalStorageUsed)} / {formatFileSize(TOTAL_STORAGE_LIMIT)}</span>
              <span className="text-green-600">({formatFileSize(remainingStorage)} remaining)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {storagePercentage.toFixed(1)}% used
              </span>
              {filesInMemory > 0 && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  {filesInMemory} files in memory
                </span>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                storagePercentage > 90 ? 'bg-red-500' :
                storagePercentage > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(storagePercentage, 100)}%` }}
            />
          </div>
        </div>
        
        {/* File Size Limits Info */}
        <div className="mt-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle size={12} />
            <span>Maximum file sizes: </span>
            <span className="font-medium">Images: {getFileSizeLimit('image')}</span>
            <span>•</span>
            <span className="font-medium">PDFs: {getFileSizeLimit('pdf')}</span>
            <span>•</span>
            <span className="font-medium">Documents: {getFileSizeLimit('document')}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <Clock size={10} />
            <em>Files are stored in memory during this session only. Page refresh will clear file data but keep metadata.</em>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-sm">
          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <Filter size={14} />
            All files ({filteredReceipts.length})
          </button>
          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <LinkIcon size={14} />
            Linked ({linkedReceipts.length})
          </button>
          <button className="flex items-center gap-1 text-gray-600 hover:text-gray-900">
            <File size={14} />
            Unlinked ({unlinkedReceipts.length})
          </button>
        </div>
      </div>

      {/* Upload Progress Section */}
      {uploadQueue.length > 0 && (
        <div className="border-b border-gray-200 p-4 bg-blue-50">
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Upload Progress</h4>
              <span className="text-xs text-gray-500">
                {uploadQueue.filter(f => f.status === 'completed').length} of {uploadQueue.length} complete
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {uploadQueue.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.status === 'completed' ? (
                      <CheckCircle className="text-green-500" size={16} />
                    ) : item.status === 'error' ? (
                      <XCircle className="text-red-500" size={16} />
                    ) : (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    )}
                    <span className="text-sm text-gray-700 truncate flex-1">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{item.size}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      item.status === 'completed' ? 'bg-green-100 text-green-800' :
                      item.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {item.status === 'completed' ? 'Completed' : 
                       item.status === 'error' ? 'Error' : 
                       'Uploading...'}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      item.status === 'completed' ? 'bg-green-500' :
                      item.status === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                {item.error && (
                  <p className="text-xs text-red-600 mt-1">{item.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!uploading && filteredReceipts.length === 0 && (
        <div className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="text-blue-500" size={24} />
          </div>
          <h4 className="text-lg font-medium text-gray-700 mb-2">No receipts uploaded yet</h4>
          <p className="text-gray-500 mb-6">
            Upload PDFs, images, or documents to keep track of your transaction receipts
          </p>
          
          {/* Demo Info Card */}
          <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg max-w-md mx-auto border border-blue-200">
            <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <CheckCircle size={16} />
              How it works:
            </h5>
            <ul className="text-xs text-blue-700 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <span><strong>Upload files</strong> (up to 5MB images, 10MB PDFs)</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <span><strong>Files stored in memory</strong> during this browser session</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <span><strong>Preview, download, or link</strong> files to transactions</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-bold text-yellow-600">!</span>
                </div>
                <span><strong>Note:</strong> Page refresh clears file data, but metadata remains</span>
              </li>
            </ul>
          </div>
          
          {/* File Size Limits Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
            <p className="text-sm font-medium text-gray-700 mb-2">File Size Limits:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-white rounded border">
                <div className="font-medium text-blue-600">Images</div>
                <div className="text-gray-600">{getFileSizeLimit('image')}</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="font-medium text-red-600">PDFs</div>
                <div className="text-gray-600">{getFileSizeLimit('pdf')}</div>
              </div>
              <div className="text-center p-2 bg-white rounded border">
                <div className="font-medium text-gray-600">Documents</div>
                <div className="text-gray-600">{getFileSizeLimit('document')}</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
          >
            <Upload className="inline mr-2" size={18} />
            Upload Your First Receipt
          </button>
          
          {/* Test with demo files */}
          <div className="mt-6">
            <p className="text-xs text-gray-500 mb-2">Try uploading a test image or PDF to see it work!</p>
          </div>
        </div>
      )}

      {/* Grid View */}
      {!uploading && filteredReceipts.length > 0 && viewMode === 'grid' && (
        <div className="p-6">
          {unlinkedReceipts.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-500">UNLINKED RECEIPTS ({unlinkedReceipts.length})</h4>
                <span className="text-xs text-gray-400">
                  {unlinkedReceipts.filter(r => fileStorage.has(r.id)).length} available in memory
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unlinkedReceipts.map(receipt => {
                  const hasFile = fileStorage.has(receipt.id);
                  const fileStatus = hasFile ? 'Available' : 'Memory only';
                  return (
                    <div key={receipt.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="p-4">
                        {/* File Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {selectedReceipts.includes(receipt.id) ? (
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Check className="text-white" size={14} />
                                </div>
                              ) : (
                                <div 
                                  onClick={() => toggleSelectReceipt(receipt.id)}
                                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer hover:border-blue-500 transition-colors"
                                />
                              )}
                            </div>
                            {getFileIcon(receipt.type)}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              hasFile 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {fileStatus}
                            </span>
                            {receipt.type === 'image' && receipt.thumbnail && !hasFile && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                Thumbnail only
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* File Info */}
                        <div className="mb-3">
                          <p className="font-medium text-gray-900 truncate" title={receipt.name}>{receipt.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{receipt.size} • {receipt.date}</p>
                          
                          {/* Image Thumbnail */}
                          {receipt.type === 'image' && receipt.thumbnail && (
                            <div className="mt-2">
                              <div 
                                className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group relative"
                                onClick={() => handlePreview(receipt)}
                              >
                                <img 
                                  src={receipt.thumbnail}
                                  alt={receipt.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                  <Eye className="text-white opacity-0 group-hover:opacity-100" size={24} />
                                </div>
                              </div>
                              {!hasFile && (
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                  Thumbnail preview only
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleLinkToTransaction(receipt)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                            title="Link to transaction"
                          >
                            <LinkIcon size={14} />
                            Link
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePreview(receipt)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                hasFile || receipt.thumbnail
                                  ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title={hasFile || receipt.thumbnail ? "Preview file" : "Preview not available"}
                              disabled={!hasFile && !receipt.thumbnail}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDownload(receipt)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                hasFile 
                                  ? 'text-gray-600 hover:text-green-600 hover:bg-green-50' 
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              title={hasFile ? "Download file" : "Download not available"}
                              disabled={!hasFile}
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteReceipt(receipt.id)}
                              className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete file"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {linkedReceipts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-500">LINKED TO TRANSACTIONS ({linkedReceipts.length})</h4>
                <span className="text-xs text-gray-400">
                  {linkedReceipts.filter(r => fileStorage.has(r.id)).length} available in memory
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {linkedReceipts.map(receipt => {
                  const transaction = account.transactions.find(t => t.id === receipt.transactionId);
                  const hasFile = fileStorage.has(receipt.id);
                  const fileStatus = hasFile ? 'Available' : 'Memory only';
                  
                  return (
                    <div key={receipt.id} className="border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="p-4">
                        {/* File Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {selectedReceipts.includes(receipt.id) ? (
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Check className="text-white" size={14} />
                                </div>
                              ) : (
                                <div 
                                  onClick={() => toggleSelectReceipt(receipt.id)}
                                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer hover:border-blue-500 transition-colors"
                                />
                              )}
                            </div>
                            {getFileIcon(receipt.type)}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Linked
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              hasFile 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {fileStatus}
                            </span>
                          </div>
                        </div>
                        
                        {/* File Info */}
                        <div className="mb-3">
                          <p className="font-medium text-gray-900 truncate" title={receipt.name}>{receipt.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{receipt.size} • {receipt.date}</p>
                          
                          {/* Image Thumbnail */}
                          {receipt.type === 'image' && receipt.thumbnail && (
                            <div className="mt-2">
                              <div 
                                className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer group relative"
                                onClick={() => handlePreview(receipt)}
                              >
                                <img 
                                  src={receipt.thumbnail}
                                  alt={receipt.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                  <Eye className="text-white opacity-0 group-hover:opacity-100" size={24} />
                                </div>
                              </div>
                              {!hasFile && (
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                  Thumbnail preview only
                                </p>
                              )}
                            </div>
                          )}
                          
                          {/* Transaction Info */}
                          {transaction && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                              <p className="text-xs font-medium text-blue-800">
                                {transaction.type === 'in' ? 'Cash In' : 'Cash Out'}: 
                                <span className={transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}>
                                  {transaction.type === 'in' ? '+' : '-'}${transaction.amount.toFixed(2)}
                                </span>
                              </p>
                              <p className="text-xs text-blue-600">{transaction.date}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePreview(receipt)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              hasFile || receipt.thumbnail
                                ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title={hasFile || receipt.thumbnail ? "Preview file" : "Preview not available"}
                            disabled={!hasFile && !receipt.thumbnail}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(receipt)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              hasFile 
                                ? 'text-gray-600 hover:text-green-600 hover:bg-green-50' 
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title={hasFile ? "Download file" : "Download not available"}
                            disabled={!hasFile}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteReceipt(receipt.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete file"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {!uploading && filteredReceipts.length > 0 && viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={selectedReceipts.length === filteredReceipts.length && filteredReceipts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReceipts(filteredReceipts.map(r => r.id));
                      } else {
                        setSelectedReceipts([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked Transaction</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReceipts.map(receipt => {
                const transaction = account.transactions.find(t => t.id === receipt.transactionId);
                const hasFile = fileStorage.has(receipt.id);
                return (
                  <tr key={receipt.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReceipts.includes(receipt.id)}
                        onChange={() => toggleSelectReceipt(receipt.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getFileIcon(receipt.type)}
                        <div>
                          <span className="font-medium text-gray-900">{receipt.name}</span>
                          <div className="flex items-center gap-1 mt-1">
                            {hasFile ? (
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                Available
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                Memory Only
                              </span>
                            )}
                            {receipt.type === 'image' && receipt.thumbnail && !hasFile && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                                Thumbnail
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">{receipt.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{receipt.size}</td>
                    <td className="px-6 py-4">
                      {hasFile ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={14} />
                          <span className="text-xs">Available</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock size={14} />
                          <span className="text-xs">Session Only</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{receipt.date}</td>
                    <td className="px-6 py-4">
                      {transaction ? (
                        <div className="flex items-center gap-2">
                          <LinkIcon className="text-green-500" size={14} />
                          <span className="text-sm text-gray-700">
                            {transaction.type === 'in' ? '+' : '-'}${transaction.amount.toFixed(2)} on {transaction.date}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleLinkToTransaction(receipt)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <LinkIcon size={14} />
                          Link to transaction
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handlePreview(receipt)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            hasFile || receipt.thumbnail
                              ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={hasFile || receipt.thumbnail ? "Preview file" : "Preview not available"}
                          disabled={!hasFile && !receipt.thumbnail}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDownload(receipt)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            hasFile 
                              ? 'text-gray-600 hover:text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={hasFile ? "Download file" : "Download not available"}
                          disabled={!hasFile}
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteReceipt(receipt.id)}
                          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete file"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Link to Transaction Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Link Receipt to Transaction</h3>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Link <span className="font-medium">"{receiptToLink?.name}"</span> to a transaction:
                </p>
                
                <select
                  value={selectedTransaction}
                  onChange={(e) => setSelectedTransaction(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a transaction...</option>
                  {account.transactions.map(transaction => (
                    <option key={transaction.id} value={transaction.id}>
                      {transaction.date} - {transaction.type === 'in' ? 'Cash In' : 'Cash Out'} - 
                      ${transaction.amount.toFixed(2)}
                    </option>
                  ))}
                </select>
                
                {selectedTransaction && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">
                      Selected transaction: {getTransactionDescription(selectedTransaction)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setReceiptToLink(null);
                    setSelectedTransaction('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLinkTransaction}
                  disabled={!selectedTransaction}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                    selectedTransaction 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  Link Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptManager;
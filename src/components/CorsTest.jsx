import { useState } from 'react';

export default function URLFinderTest() {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  // Different possible URL patterns
  const urlsToTest = [
    'http://localhost/sites/api/cors-test.php',
    'http://localhost/sites/ledger-backend/api/cors-test.php',
    'http://localhost/sites/ledger-backend-main/api/cors-test.php',
    'http://localhost/api/cors-test.php',
    'http://localhost:8000/cors-test.php',
    'http://localhost:80/sites/api/cors-test.php',
    'http://127.0.0.1/sites/api/cors-test.php',
  ];

  const testAllURLs = async () => {
    setTesting(true);
    setResults([]);
    
    for (const url of urlsToTest) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(url, {
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        setResults(prev => [...prev, {
          url,
          success: true,
          status: response.status,
          data
        }]);
      } catch (err) {
        setResults(prev => [...prev, {
          url,
          success: false,
          error: err.message
        }]);
      }
    }
    
    setTesting(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">🔍 Find Your API URL</h1>
      <p className="text-gray-600 mb-6">
        This will test different URL patterns to find where your API is actually hosted.
      </p>

      <button
        onClick={testAllURLs}
        disabled={testing}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6"
      >
        {testing ? 'Testing...' : 'Test All URLs'}
      </button>

      <div className="space-y-3">
        {results.map((result, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-4 ${
              result.success ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-mono text-sm mb-2">{result.url}</p>
                {result.success ? (
                  <div className="text-green-700">
                    <p className="font-bold">✅ FOUND IT! This URL works!</p>
                    <p className="text-xs mt-1">Status: {result.status}</p>
                    {result.data && (
                      <pre className="mt-2 bg-white p-2 rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">❌ {result.error}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && !testing && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">📋 Next Steps:</h3>
          {results.some(r => r.success) ? (
            <div className="space-y-2 text-sm">
              <p className="text-green-700 font-semibold">
                ✅ Found working URL! Use this in your React app:
              </p>
              <code className="block bg-white p-2 rounded border">
                {results.find(r => r.success)?.url.replace('/cors-test.php', '')}
              </code>
              <p className="text-gray-600 mt-2">
                Update your API base URL to use this path.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-sm text-red-700">
              <p className="font-semibold">❌ No working URLs found. Possible issues:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>PHP server is not running</li>
                <li>cors-test.php file is not in the right location</li>
                <li>Apache/PHP configuration issue</li>
                <li>Different port number needed</li>
              </ul>
              <p className="mt-3 font-semibold">Try these commands:</p>
              <div className="bg-gray-800 text-green-400 p-2 rounded font-mono text-xs mt-2">
                # Check if Apache is running:<br/>
                tasklist | findstr "httpd.exe"<br/>
                <br/>
                # Or start PHP built-in server:<br/>
                cd /path/to/sites/api<br/>
                php -S localhost:8000
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold mb-2">🛠️ Manual Check:</h3>
        <p className="text-sm mb-2">Open these in a new browser tab to verify:</p>
        <ul className="space-y-1">
          {urlsToTest.slice(0, 3).map(url => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm font-mono"
              >
                {url}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
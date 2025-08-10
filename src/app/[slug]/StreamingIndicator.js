export default function StreamingIndicator({ stage = 'loading' }) {
  const getStageText = () => {
    switch (stage) {
      case 'country': return 'Loading country data...';
      case 'offers': return 'Fetching offers...';
      case 'complete': return 'Complete!';
      default: return 'Loading...';
    }
  };

  const getStageProgress = () => {
    switch (stage) {
      case 'country': return 33;
      case 'offers': return 66;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <div className="text-center py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getStageProgress()}%` }}
            ></div>
          </div>
        </div>
        <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {getStageText()}
        </div>
        <p className="text-gray-600 text-sm mt-2">
          {stage === 'country' && 'Fetching country information...'}
          {stage === 'offers' && 'Loading offers and filters...'}
          {stage === 'complete' && 'All data loaded successfully!'}
        </p>
      </div>
    </div>
  );
}

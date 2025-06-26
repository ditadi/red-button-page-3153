
import { Button } from '@/components/ui/button';
// Removed useState import as it is not needed for this task.
// No need to import types from server/src/schema as no backend interaction is required for this task.
// No need to import trpc as no backend interaction is required for this task.

function App() {
  // Removed the unused useState hook to resolve the lint error.

  // An empty function for the button's onClick event, as no action is required.
  const handleClick = () => {
    // This button does nothing.
    console.log("Button clicked, but no action triggered.");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Button
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg"
        onClick={handleClick}
      >
        Click here
      </Button>
    </div>
  );
}

export default App;

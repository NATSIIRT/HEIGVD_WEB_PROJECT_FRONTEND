import { greet } from "crypto";
function Home() {
  const handleClick = () => {
    greet();
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl">Home</h1>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleClick}
      >
        Click Me
      </button>
      <p className="mt-4 text-gray-600">
        This is a simple home page with a button.
      </p>
    </div>
  );
}
export default Home;

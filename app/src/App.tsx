import ErrorPage from "./pages/Error";
import Header from "./components/Header";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <>
        <Header />
      </>
    ),
    errorElement: <ErrorPage />,
  },
]);

function App() {
  return (
    <div className="w-full h-full bg-default text-white">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

import ErrorPage from "./pages/Error";
import Header from "./components/Header";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PoolPage from "./pages/StakingPool";

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
  {
    path: "/pool/:address",
    element: (
      <>
        <Header />
        <PoolPage />
      </>
    ),
    errorElement: <ErrorPage />,
  },
]);

function App() {
  return (
    <div className="w-full h-full text-white overflow-auto">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

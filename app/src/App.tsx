import ErrorPage from "./pages/Error";
import Header from "./components/Header";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import PoolPage from "./pages/StakingPool";
import { base } from "./config";
import PoolAdminPage from "./pages/PoolsAdmin";
import BoostPage from "./pages/Boost";

const router = createBrowserRouter([
  {
    path: `${base}`,
    element: (
      <>
        <Header />
        <PoolAdminPage />
      </>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: `${base}/pool/:address`,
    element: (
      <>
        <Header />
        <PoolPage />
      </>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: `${base}/pool/:address/boost/:boostIndex`,
    element: (
      <>
        <Header />
        <BoostPage />
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

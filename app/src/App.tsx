import ErrorPage from "./pages/Error";
import Header from "./components/Header";
import { RouterProvider, createHashRouter } from "react-router-dom";
import PoolPage from "./pages/StakingPool";
import PoolAdminPage from "./pages/PoolsAdmin";
import BoostPage from "./pages/Boost";

const router = createHashRouter([
  {
    path: "/",
    element: (
      <>
        <Header />
        <PoolAdminPage />
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
  {
    path: "/pool/:address/boost/:boostIndex",
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
    <div className="w-full h-full text-black overflow-auto scrollbar-modern">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

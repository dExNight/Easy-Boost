import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div>
      <div
        id="error-page"
        className="w-full h-full flex gap-2 flex-col items-center justify-center"
      >
        <h1 className="text-8xl">404</h1>
        <h2 className="text-4xl">Page not found</h2>
        <p className="text-xl text-center">
          You probably got here because of a page address error.
        </p>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="text-center py-16 space-y-4">
      <h1 className="text-6xl font-extrabold text-blue-500">404</h1>
      <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
      <p className="text-slate-400 text-sm max-w-sm mx-auto">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="pt-2">
        <Link to="/">
          <Button variant="primary">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

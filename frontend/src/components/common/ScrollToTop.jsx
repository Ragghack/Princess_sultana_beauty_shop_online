import { useEffect } from "react";
import { useLocation } from "react-router-dom";
 
// Resets scroll position to the top whenever the route changes.
// Without this, React Router keeps the previous page's scroll offset,
// so navigating from a long page to a short one can land the user
// inside/near the footer instead of at the top of the new page.
const ScrollToTop = () => {
  const { pathname } = useLocation();
 
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
 
  return null;
};
 
export default ScrollToTop;
 

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@context/AuthContext";
import { CartProvider } from "@context/CartContext";
import { WishlistProvider } from "@context/WishlistContext";
import AppRoutes from "./routes/AppRoutes";
import ServerWakingBanner from "@components/common/ServerWakingBanner";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

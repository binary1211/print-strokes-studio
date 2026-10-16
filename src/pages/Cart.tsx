import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/AppContext";

// ponytail: No separate cart page needed. Redirect to home and slide open the right-side Cart Drawer.
const Cart = () => {
  const navigate = useNavigate();
  const { openCart } = useCart();

  useEffect(() => {
    openCart();
    navigate("/", { replace: true });
  }, [openCart, navigate]);

  return null;
};

export default Cart;

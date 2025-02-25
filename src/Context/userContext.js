import { createContext, useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

// API
import axios from "../axios";

// User Context
export const UserContext = createContext();

export const CurrentUserProvider = (props) => {
  // Calling Hooks
  const history = useHistory();

  // Fetching from browser local storage
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("bookshlf_user"))
  );

  // function to logout if token is expired
  const Logout = () => {
    setUser(null);
    localStorage.removeItem("bookshlf_user");
    delete axios.defaults.headers.common["Authorization"];
    history.go(0);
  };

  // function to get count of wishlist & cart items
  const FetchCount = (roles) => {
    axios.get("/countWishlistItems").then((wishlist) => {
      axios.get("/countCartItems").then((cart) => {
        if (roles.includes("seller")) {
          axios
            .get("/getCurrentBalance")
            .then((balance) => {
              setUser((prev) => {
                return {
                  ...prev,
                  roles: roles,
                  cartitems: cart.data.count,
                  wishlist: wishlist.data.count,
                  balance: Math.round(balance.data.walletBalance * 10) / 10,
                };
              });
            })
            .catch((error) => {
              setUser((prev) => {
                return {
                  ...prev,
                  roles: roles,
                  cartitems: cart.data.count,
                  wishlist: wishlist.data.count,
                  balance: 0,
                };
              });
            });
        } else {
          setUser((prev) => {
            return {
              ...prev,
              roles: roles,
              cartitems: cart.data.count,
              wishlist: wishlist.data.count,
            };
          });
        }
      });
    });
  };

  // function to verify is token is valid
  const verifyToken = () => {
    axios
      .get("/getUserProfile")
      .then((response) => {
        // console.log(response.data);
        setUser((prev) => {
          return { ...prev, adminPermissions: response.data.adminPermissions };
        });
        FetchCount(response.data.roles);
      })
      .catch((error) => {
        Logout();
      });
  };

  useEffect(() => {
    // verifying token
    if (user) {
      // console.log(user);
      verifyToken();
    }
  }, [user?.authHeader]);

  useEffect(() => {
    // console.log("use effect called - local", user);
    localStorage.setItem("bookshlf_user", JSON.stringify(user));
  }, [user]);

  return (
    <UserContext.Provider value={[user, setUser]}>
      {props.children}
    </UserContext.Provider>
  );
};

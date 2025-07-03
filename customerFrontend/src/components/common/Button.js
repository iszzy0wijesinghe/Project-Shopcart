import React from "react";
import { Loader2 } from "lucide-react";
import "./Button.css";

export const Button = ({
  children,
  variant = "primary", // options: primary, secondary, outline, danger, signup
  size = "medium",       // options: small, medium, large
  loading = false,
  width,                 // custom width (e.g., "200px" or "50%")
  height,                // custom height (e.g., "50px")
  className = "",
  style,
  ...props
}) => {
  // Map the variant prop to its CSS class name.
  let variantClass = "";
  switch (variant) {
    case "primary":
      variantClass = "button--primary";
      break;
    case "secondary":
      variantClass = "button--secondary";
      break;
    case "outline":
      variantClass = "button--outline";
      break;
    case "danger":
      variantClass = "button--danger";
      break;
    case "signup":
      variantClass = "signup-button-header";
      break;
    default:
      variantClass = "button--primary";
  }

  // Map the size prop to its CSS class name.
  let sizeClass = "";
  switch (size) {
    case "small":
      sizeClass = "button--small";
      break;
    case "medium":
      sizeClass = "button--medium";
      break;
    case "large":
      sizeClass = "button--large";
      break;
    default:
      sizeClass = "button--medium";
  }

  // Combine the base class, variant class, and size class along with any extra className provided.
  const classes = `button ${variantClass} ${sizeClass} ${className}`.trim();

  // Merge custom width and height into inline styles if provided.
  const combinedStyle = { ...style };
  if (width) combinedStyle.width = width;
  if (height) combinedStyle.height = height;

  return (
    <button
      className={classes}
      style={combinedStyle}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="button-loader" />}
      {children}
    </button>
  );
};

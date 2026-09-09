import React from "react";

export default function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  type = "button",
  disabled = false,
  onClick,
  ...props
}) {
  const classes = [
    "ui-button",
    `ui-button-${variant}`,
    `ui-button-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
import React from "react";
import {
  Alert as MuiAlert,
  AlertColor,
  AlertProps,
  Snackbar,
} from "@mui/material";
import { RootState } from "~/app/store";
import { useAppDispatch, useAppSelector } from "~/app/hooks";
import { setOpen } from "./toastSlice";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const Toast: React.FC<{ severity?: AlertColor }> = (props) => {
  const toast = useAppSelector((state: RootState) => state.toast);
  const dispatch = useAppDispatch();

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }

    dispatch(setOpen(false));
  };

  return (
    <Snackbar
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "center",
      }}
      open={toast.open}
      autoHideDuration={6000}
      onClose={handleClose}
    >
      <Alert
        onClose={handleClose}
        severity={props.severity || toast.severity || "error"}
        style={{ width: "100%", minWidth: 318 }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;

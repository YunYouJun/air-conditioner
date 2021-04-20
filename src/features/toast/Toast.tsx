import { Alert, Snackbar } from "@material-ui/core";
import { RootState } from "../../app/store";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setOpen } from "./toastSlice";

export default function Toast() {
  const toast = useAppSelector((state: RootState) => state.toast);
  const dispatch = useAppDispatch();

  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    dispatch(setOpen(false));
  };

  return (
    <Snackbar open={toast.open} autoHideDuration={5000} onClose={handleClose}>
      <Alert onClose={handleClose} severity="error" style={{ width: "100%" }}>
        {toast.message}
      </Alert>
    </Snackbar>
  );
}

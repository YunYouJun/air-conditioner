import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ToastState {
  /**
   * 是否打开
   */
  open: boolean;
  /**
   * 消息内容
   */
  message: string;
}

const initialState: ToastState = {
  open: false,
  message: "",
};

export const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    /**
     * 设置提示框内容
     * @param state
     * @param action
     */
    setMessage(state, action: PayloadAction<string>) {
      state.message = action.payload;
    },
    /**
     * 设置提示框是否显示
     * @param state
     * @param action
     */
    setOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
  },
});

export const { setMessage, setOpen } = toastSlice.actions;

export default toastSlice.reducer;

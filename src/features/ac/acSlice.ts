import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppThunk, RootState } from "../../app/store";
import { setMessage, setOpen } from "../toast/toastSlice";

export interface AcState {
  /**
   * 状态
   */
  status: boolean;
  /**
   * 模式
   */
  mode: "cold" | "hot";
  /**
   * 温度
   */
  temperature: number;
}

export type AcMode = "cold" | "hot";

const initialState: AcState = {
  status: false,
  mode: "cold",
  temperature: 16,
};

const maxTemperature = 31;
const minTemperature = 16;

export const acSlice = createSlice({
  name: "ac",
  initialState,
  reducers: {
    /**
     * 增加温度
     * @param state
     */
    increment: (state) => {
      state.temperature += 1;
    },

    /**
     * 降低温度
     * @param state
     */
    decrement: (state) => {
      state.temperature -= 1;
    },

    /**
     * 设置空调模式
     * @param state
     * @param action
     */
    setMode(state, action: PayloadAction<AcMode>) {
      state.mode = action.payload;
    },

    /**
     * 切换开关状态
     * @param state
     * @param action
     */
    toggleStatus(state) {
      state.status = !state.status;
    },
  },
});

export const selectTemperature = (state: RootState) => state.ac.temperature;

export const { increment, decrement, setMode, toggleStatus } = acSlice.actions;

/**
 * 增加温度
 * @returns
 */
export const increaseTemperature = (): AppThunk => (dispatch, getState) => {
  const currentValue = selectTemperature(getState());
  if (currentValue < maxTemperature) {
    dispatch(increment());
  } else {
    dispatch(setMessage("已经是最大温度啦！"));
    dispatch(setOpen(true));
  }
};

/**
 * 降低温度
 * @returns
 */
export const decreaseTemperature = (): AppThunk => (dispatch, getState) => {
  const currentValue = selectTemperature(getState());
  if (currentValue > minTemperature) {
    dispatch(decrement());
  } else {
    dispatch(setMessage("已经是最小温度啦！"));
    dispatch(setOpen(true));
  }
};

export default acSlice.reducer;

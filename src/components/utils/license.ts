import { invoke } from "@tauri-apps/api/core";

export const isTrialValid = async () => {
  try {
    let res = await invoke("is_trial_valid");
    return res;

  } catch (err) {
    return false;
  }
}
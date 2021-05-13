import RemoteControl from "../components/RemoteControl";
import Copyright from "../layouts/Copyright";
import { useDetectStorage } from "../features/ac";

export default function Rc() {
  useDetectStorage();
  return (
    <div>
      <RemoteControl />
      <Copyright />
    </div>
  );
}

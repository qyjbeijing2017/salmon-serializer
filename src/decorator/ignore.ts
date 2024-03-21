import { SerializableMode } from "../serializable-meta";
import { SerializeField } from "./serialize-field";

export function Ignore<T>() {
    return SerializeField<T>({ mode: SerializableMode.IGNORE });
}

import { SerializableMode } from "../serializable-meta";
import { SerializeField } from "./serialize-field";

export function Include<T>() {
    return SerializeField<T>({ mode: SerializableMode.TO_PLAIN_AND_CLASS });
}

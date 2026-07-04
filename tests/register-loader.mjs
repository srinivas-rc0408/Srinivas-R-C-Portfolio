import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./resolve-next.mjs", pathToFileURL("./tests/"));

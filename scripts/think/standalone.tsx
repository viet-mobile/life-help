import { createRoot } from "react-dom/client";
import { ThinkPilot } from "@/components/think/ThinkPilot";

import { allTasks } from "@/lib/think/tasks";

createRoot(document.getElementById("root")!).render(<ThinkPilot initialTasks={allTasks} />);

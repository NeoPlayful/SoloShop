import { SidebarLayout } from "../../components/layouts/SidebarLayout.js";
import { HtmlTable } from "../../components/data/HtmlTable.js";
import { CenteredModal } from "../../components/feedback/CenteredModal.js";
import { NumberedPagination } from "../../components/navigation/NumberedPagination.js";

export const components = {
  AdminLayout: SidebarLayout,
  Table: HtmlTable,
  Modal: CenteredModal,
  Pagination: NumberedPagination,
} as const;

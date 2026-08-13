import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import AddButton from "@/components/reusable/AddButton";
import LanguageDropdown from "@/components/reusable/LanguageDropdown";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import { routeDisplayNames } from "@/types/sidebar.types";

const AppHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const routePath = location.pathname;

  const { headerAction } = useUiHeaderStore();

  const displayName = routePath
    ? routeDisplayNames[routePath as keyof typeof routeDisplayNames]
    : "";

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        {displayName && <span className="text-md font-semibold text-black">{t(displayName)}</span>}

        <div className="ml-auto flex items-center gap-2">
          <LanguageDropdown />
          {headerAction && (
            <AddButton
              title={headerAction.label}
              onButtonClick={headerAction.onClick}
              disabled={headerAction.disabled}
              icon={headerAction.icon}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

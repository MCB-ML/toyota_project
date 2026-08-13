import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { languagesList } from "@/types/sidebar.types";
import { useAuth } from "../../auth/hooks/useAuth";

const LanguageDropdown = () => {
  const { i18n } = useTranslation();

  const { user } = useAuth();

  const [openDropdown, setOpenDropdown] = useState<boolean>(false);

  const currentLanguage =
    languagesList.find((lang) => lang.code === user?.defaultLanguage) || languagesList[0];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setOpenDropdown(false);
  };

  useEffect(() => {
    i18n.changeLanguage(currentLanguage.code);
  }, [user?.defaultLanguage]);

  return (
    <Popover open={openDropdown} onOpenChange={setOpenDropdown}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer mr-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline-block text-xs">{currentLanguage.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="end">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col gap-1">
            {languagesList.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  i18n.language === lang.code
                    ? "bg-accent text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
};

export default LanguageDropdown;

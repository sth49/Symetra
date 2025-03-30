import { Icon } from "@chakra-ui/react";
import React, {
  createContext,
  isValidElement,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { IoIosArrowDown } from "react-icons/io";
type PopoverContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  position: Position;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  setPopoverText: React.Dispatch<React.SetStateAction<string>>;
  popoverText: string;
};

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

export const PopoverProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [popoverText, setPopoverText] = useState<string>("");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const calculatePosition = () => {
    if (triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
      let y = triggerRect.bottom;

      if (x + contentRect.width > viewportWidth) {
        x = viewportWidth - contentRect.width;
      }

      if (x < 0) {
        x = 0;
      }

      if (triggerRect.bottom + contentRect.height > viewportHeight) {
        y = triggerRect.top - contentRect.height;
      }

      if (y < 0) {
        y = 0;
      }

      setPosition({ x, y });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [close]);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener("resize", calculatePosition);
    }

    return () => {
      window.removeEventListener("resize", calculatePosition);
    };
  }, [isOpen]);

  return (
    <PopoverContext.Provider
      value={{
        isOpen,
        open,
        close,
        position,
        triggerRef,
        contentRef,
        setPopoverText,
        popoverText,
      }}
    >
      {children}
    </PopoverContext.Provider>
  );
};

export const Popover = ({ children }: { children: ReactNode }) => {
  return <PopoverProvider>{children}</PopoverProvider>;
};

type Position = {
  x: number;
  y: number;
};

export const PopoverTrigger = ({
  asChild = false,
  children,
}: PropsWithChildren<{ asChild: boolean }>) => {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error("PopoverTrigger는 Popover내부에서 호출해야 합니다.");
  }

  const { isOpen, open, triggerRef, setPopoverText, close } = context;

  useEffect(() => {
    if (typeof children === "string" || typeof children === "number") {
      setPopoverText(children.toString());
    }
  }, [children, setPopoverText]);

  if (asChild && isValidElement(children)) {
    return React.cloneElement(children as ReactElement, {
      ref: triggerRef,
      onClick: open,
    });
  }

  return (
    <button
      style={{
        cursor: "pointer",
        border: "1px solid #DEE4ED",
        padding: "2px 6px",
        fontSize: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: "2px",
      }}
      ref={triggerRef}
      onClick={() => {
        if (isOpen) {
          close();
        } else {
          open();
        }
      }}
    >
      {children}
      <Icon
        as={IoIosArrowDown}
        style={{
          marginLeft: "4px",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        }}
      ></Icon>
    </button>
  );
};

export const PopoverContent = ({ children }: { children: ReactNode }) => {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error("PopoverContent는 Popover내부에서 호출해야 합니다.");
  }

  const { isOpen, close, position, contentRef, popoverText } = context;

  useEffect(() => {
    if (isOpen && popoverText && contentRef.current) {
      const elements = contentRef.current.querySelectorAll("div");
      elements.forEach((el: any) => {
        if (el.textContent?.trim() === popoverText) {
          el.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    }
  }, [contentRef, isOpen, popoverText]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        transform: "translate(0, 0)",
        backgroundColor: "white",
        width: "200px",
        maxHeight: "100px",
        border: "1px solid #ddd",
        zIndex: 100,
        padding: 4,
        position: "absolute",
        overflow: "auto",
      }}
      ref={contentRef}
    >
      {children}
    </div>
  );
};

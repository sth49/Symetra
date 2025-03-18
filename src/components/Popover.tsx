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
  setPopoverText: React.Dispatch<React.SetStateAction<string>>; // Added property
  popoverText: string; // Added property
};

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

// export const PopoverProvider = ({ children }: { children: ReactNode }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

//   const triggerRef = useRef<HTMLButtonElement>(null);
//   const contentRef = useRef<HTMLDivElement>(null);

//   const open = () => setIsOpen(true);
//   const close = () => setIsOpen(false);

//   const calculatePosition = () => {
//     if (triggerRef.current && contentRef.current) {
//       const triggerRect = triggerRef.current.getBoundingClientRect();
//       const contentRect = contentRef.current.getBoundingClientRect();
//       const viewportWidth = window.innerWidth;
//       const viewportHeight = window.innerHeight;

//       // 가운데 위치 (버튼의 가운데에 팝업이 위치하도록 계산)
//       let x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
//       let y = triggerRect.bottom; // 버튼 바로 아래로 위치

//       // 화면 오른쪽을 벗어나지 않도록 보정
//       if (x + contentRect.width > viewportWidth) {
//         x = viewportWidth - contentRect.width; // 화면 오른쪽을 벗어나지 않도록 x 위치 조정
//       }

//       // 화면 왼쪽을 벗어나지 않도록 보정
//       if (x < 0) {
//         x = 0; // 화면 왼쪽을 벗어나지 않도록 x 위치 조정
//       }

//       // 화면 아래쪽을 벗어나지 않도록 보정
//       if (triggerRect.bottom + contentRect.height > viewportHeight) {
//         y = triggerRect.top - contentRect.height; // 화면 위로 이동
//       }

//       setPosition({ x, y });
//     }
//   };

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         contentRef.current &&
//         !contentRef.current.contains(event.target as Node) // 클릭한 영역이 Content 내부가 아닌 경우
//       ) {
//         close();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside); // 마우스 클릭 이벤트 추가

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside); // 컴포넌트 언마운트 시 제거
//     };
//   }, [close, contentRef]);

//   useEffect(() => {
//     if (isOpen) {
//       calculatePosition(); // 초기 위치 계산
//       window.addEventListener("resize", calculatePosition); // resize 이벤트 감지
//     }

//     return () => {
//       window.removeEventListener("resize", calculatePosition); // cleanup
//     };
//   }, [isOpen]);

//   return (
//     <PopoverContext.Provider
//       value={{ isOpen, open, close, position, triggerRef, contentRef }}
//     >
//       {children}
//     </PopoverContext.Provider>
//   );
// };

export const PopoverProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [popoverText, setPopoverText] = useState<string>(""); // 팝업에 표시될 텍스트 저장

  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const calculatePosition = () => {
    if (triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect(); // Trigger 버튼 위치
      const contentRect = contentRef.current.getBoundingClientRect(); // PopoverContent 크기
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 가운데 위치 (버튼의 가운데에 팝업이 위치하도록 계산)
      let x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
      let y = triggerRect.bottom; // 버튼 바로 아래로 위치

      // 화면 오른쪽을 벗어나지 않도록 보정
      if (x + contentRect.width > viewportWidth) {
        x = viewportWidth - contentRect.width; // 화면 오른쪽을 벗어나지 않도록 x 위치 조정
      }

      // 화면 왼쪽을 벗어나지 않도록 보정
      if (x < 0) {
        x = 0; // 화면 왼쪽을 벗어나지 않도록 x 위치 조정
      }

      // 화면 아래쪽을 벗어나지 않도록 보정
      if (triggerRect.bottom + contentRect.height > viewportHeight) {
        y = triggerRect.top - contentRect.height; // 화면 위로 이동
      }

      // 화면 위쪽을 벗어나지 않도록 보정 (하단 중간으로 나타나지 않는 경우에 대비)
      if (y < 0) {
        y = 0; // 화면 위쪽을 벗어나지 않도록 y 위치 조정
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

// export const PopoverTrigger = ({
//   asChild = false,
//   children,
// }: PropsWithChildren<{ asChild: boolean }>) => {
//   const context = useContext(PopoverContext);

//   if (!context) {
//     throw new Error("PopoverTrigger는 Popover내부에서 호출해야 합니다.");
//   }

//   const { open, triggerRef } = context;

//   if (asChild && isValidElement(children)) {
//     return React.cloneElement(children as ReactElement, {
//       ref: triggerRef,
//       onClick: open,
//     });
//   }

//   return (
//     <button ref={triggerRef} onClick={open}>
//       {children}
//     </button>
//   );
// };
export const PopoverTrigger = ({
  asChild = false,
  children,
}: PropsWithChildren<{ asChild: boolean }>) => {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error("PopoverTrigger는 Popover내부에서 호출해야 합니다.");
  }

  const { isOpen, open, triggerRef, setPopoverText, close } = context;

  // 텍스트 정보를 PopoverContent로 전달하기 위해 상태로 설정
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

// export const PopoverContent = ({ children }: { children: ReactNode }) => {
//   const context = useContext(PopoverContext);

//   if (!context) {
//     throw new Error("PopoverContent는 Popover내부에서 호출해야 합니다.");
//   }

//   const { isOpen, close, position, contentRef } = context;

//   if (!isOpen) return null;

//   return (
//     <div
//       style={{
//         top: `${position.y}px`, // 버튼 바로 아래로 위치
//         left: `${position.x}px`, // 버튼의 왼쪽 위치
//         transform: "translate(0, 0)", // transform을 0, 0으로 설정
//         backgroundColor: "white",
//         width: "200px",
//         maxHeight: "100px",
//         border: "1px solid #ddd",
//         zIndex: 100,
//         padding: 4,
//         position: "absolute", // 절대 위치 설정
//         overflow: "auto",
//       }}
//       ref={contentRef}
//     >
//       {children}
//     </div>
//   );
// };

// export const PopoverContent = ({ children }: { children: ReactNode }) => {
//   const context = useContext(PopoverContext);

//   if (!context) {
//     throw new Error("PopoverContent는 Popover내부에서 호출해야 합니다.");
//   }

//   const { isOpen, close, position, contentRef, triggerRef } = context;

//   useEffect(() => {
//     if (isOpen && contentRef.current) {
//       contentRef.current.scrollIntoView({
//         behavior: "smooth",
//         block: "start",
//       });
//     }
//   }, [isOpen, contentRef]);

//   if (!isOpen) return null;

//   return (
//     <div
//       style={{
//         top: `${position.y}px`, // 버튼 바로 아래로 위치
//         left: `${position.x}px`, // 버튼의 왼쪽 위치
//         transform: "translate(0, 0)", // transform을 0, 0으로 설정
//         backgroundColor: "white",
//         width: "200px",
//         maxHeight: "100px",
//         border: "1px solid #ddd",
//         zIndex: 100,
//         padding: 4,
//         position: "absolute", // 절대 위치 설정
//         overflow: "auto",
//       }}
//       ref={contentRef}
//     >
//       {children}
//       <button onClick={close} style={{ marginTop: "10px" }}>
//         Close
//       </button>
//     </div>
//   );
// };

// export const PopoverContent = ({ children }: { children: ReactNode }) => {
//   const context = useContext(PopoverContext);

//   if (!context) {
//     throw new Error("PopoverContent는 Popover내부에서 호출해야 합니다.");
//   }

//   const { isOpen, close, position, contentRef, popoverText } = context;

//   return (
//     <div
//       style={{
//         top: `${position.y}px`,
//         left: `${position.x}px`,
//         transform: "translate(0, 0)",
//         backgroundColor: "white",
//         width: "150px",
//         maxHeight: "100px",
//         border: "1px solid #ddd",
//         zIndex: 100,
//         padding: 4,
//         position: "absolute",
//         overflow: "auto",
//         borderRadius: "2px",
//       }}
//       ref={contentRef}
//     >
//       {React.Children.map(children, (child) => {
//         if (typeof child === "string" || typeof child === "number") {
//           return <div>{child}</div>;
//         }
//         return child;
//       })}
//     </div>
//   );
// };

export const PopoverContent = ({ children }: { children: ReactNode }) => {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error("PopoverContent는 Popover내부에서 호출해야 합니다.");
  }

  const { isOpen, close, position, contentRef, popoverText } = context;

  // 팝업이 열리면 해당 텍스트로 스크롤
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
        top: `${position.y}px`, // 버튼 바로 아래로 위치
        left: `${position.x}px`, // 버튼의 왼쪽 위치
        transform: "translate(0, 0)",
        backgroundColor: "white",
        width: "200px",
        maxHeight: "100px",
        border: "1px solid #ddd",
        zIndex: 100,
        padding: 4,
        position: "absolute", // 절대 위치 설정
        overflow: "auto",
      }}
      ref={contentRef}
    >
      {children}
    </div>
  );
};

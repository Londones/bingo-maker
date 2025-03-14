import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useEditor } from "@/hooks/useEditor";
import { convertFileToBase64 } from "@/lib/utils";
import { LocalImage } from "@/types/types";
import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  useCallback,
  memo,
} from "react";
import { toast } from "sonner";

const ImageControls = () => {
  const { state, actions } = useEditor();
  const containerRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState(() => {
    const posStr = state.background.backgroundImagePosition || "50% 50%";
    const [x, y] = posStr.split(" ").map((val) => parseInt(val));
    return {
      x: isNaN(x!) ? 50 : x,
      y: isNaN(y!) ? 50 : y,
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const initialPositionRef = useRef({ x: 0, y: 0 });
  const initialMouseRef = useRef({ x: 0, y: 0 });

  const updateBackgroundPosition = useCallback(() => {
    actions.updateBackground({
      backgroundImagePosition: `${position.x}% ${position.y}%`,
    });
  }, [actions, position.x, position.y]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - initialMouseRef.current.x;
      const deltaY = e.clientY - initialMouseRef.current.y;

      const newX = Math.max(
        0,
        Math.min(
          100,
          initialPositionRef.current.x + (deltaX / rect.width) * 100
        )
      );
      const newY = Math.max(
        0,
        Math.min(
          100,
          initialPositionRef.current.y + (deltaY / rect.height) * 100
        )
      );

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        updateBackgroundPosition();
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updateBackgroundPosition]);

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      initialPositionRef.current = { x: position.x!, y: position.y! };
      initialMouseRef.current = { x: e.clientX, y: e.clientY };
    },
    [position.x, position.y]
  );

  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
      );
      const y = Math.max(
        0,
        Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
      );

      setPosition({ x, y });
      actions.updateBackground({
        backgroundImagePosition: `${x}% ${y}%`,
      });
    },
    [actions]
  );

  const errorToast = useCallback((message: string) => {
    toast.error(message, {
      duration: 3000,
    });
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (state.background.backgroundImage) {
      actions.updateBackground({
        ...state.background,
        backgroundImage: undefined,
        backgroundImageOpacity: undefined,
        backgroundImagePosition: undefined,
      });
      const localBackgroundImage = state.localImages?.find(
        (image) => image.type === "background"
      );
      if (localBackgroundImage) {
        actions.removeLocalBackgroundImage();
      }
    }
  }, [state.background, state.localImages, actions]);

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        errorToast("Please select an image file");
        return;
      }

      // Validate file size (4MB)
      if (file.size > 4 * 1024 * 1024) {
        errorToast("Image must be less than 4MB");
        return;
      }

      const base64Data = await convertFileToBase64(file);

      const localImage: LocalImage = {
        url: base64Data,
        type: "background",
        fileInfo: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
      };

      actions.setLocalImage(localImage);
    },
    [actions, errorToast]
  );

  const handleOpacityChange = useCallback(
    (value: number[]) => {
      actions.updateBackground({
        ...state.background,
        backgroundImageOpacity: value[0],
      });
    },
    [actions, state.background]
  );

  const handleSizeChange = useCallback(
    (value: number[]) => {
      actions.updateBackground({
        ...state.background,
        backgroundImageSize: value[0],
      });
    },
    [actions, state.background]
  );

  // Memoize background style to prevent unnecessary recalculations
  const backgroundStyle = {
    backgroundImage: `url(${state.background.backgroundImage})`,
    backgroundSize: `${state.background.backgroundImageSize}%` || "100%",
    backgroundPosition: `${position.x}% ${position.y}%`,
    backgroundRepeat: "no-repeat",
  };

  // Memoize handle position style
  const handleStyle = {
    left: `${position.x}%`,
    top: `${position.y}%`,
  };

  return (
    <div className="space-y-4">
      {state.background.backgroundImage ? (
        <div>
          <div
            ref={containerRef}
            className="relative w-full h-48 border rounded-lg overflow-hidden cursor-pointer"
            onClick={handleImageClick}
          >
            <div className="w-full h-full" style={backgroundStyle} />
            <div
              onMouseDown={startDrag}
              className="absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={handleStyle}
            />
          </div>

          <div className="space-y-4 mt-2 flex flex-col">
            <label className="text-sm">Opacity</label>
            <Slider
              value={[state.background.backgroundImageOpacity ?? 100]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleOpacityChange}
            />

            <Label>Zoom</Label>
            <Slider
              value={[
                state.background.backgroundImageSize
                  ? state.background.backgroundImageSize
                  : 100,
              ]}
              min={50}
              max={200}
              step={1}
              onValueChange={handleSizeChange}
            />

            <Button variant="destructive" onClick={handleRemoveImage}>
              Remove Image
            </Button>
          </div>
        </div>
      ) : (
        <Input type="file" onChange={(e) => void handleFileSelect(e)} />
      )}
    </div>
  );
};

export default memo(ImageControls);

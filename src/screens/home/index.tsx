import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import { FaEraser, FaUndo, FaRedo, FaSave, FaUpload } from 'react-icons/fa';
import { FiTool } from 'react-icons/fi';



interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [showTools, setShowTools] = useState(true);
    const [isEraser, setIsEraser] = useState(false);
    const [eraserSize, setEraserSize] = useState(10); 
    const [history, setHistory] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const [uploadedImages, setUploadedImages] = useState<
  { id: string; image: HTMLImageElement; position: { x: number; y: number } }[]
>([]);

    
    
    // Default eraser size

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(['Typeset', window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            console.log(result);
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight - canvas.offsetTop;
                    ctx.lineCap = 'round';
                    ctx.lineWidth = 3;
                }
            }
        };
    
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas(); // Initial call to set the correct size
    
        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);
    

    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
            }
        }
        const script = document.createElement('script');
        script.src =
            'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
            });
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const renderLatexToCanvas = (expression: any, answer: any) => {
        // Debug logs to inspect the types and values
        console.log("Expression type:", typeof expression, "Value:", expression);
        console.log("Answer type:", typeof answer, "Value:", answer);
    
        // Convert expression and answer to strings and remove spaces
        const formattedExpression = String(expression || "").replace(/\s+/g, "\\ ");
        const formattedAnswer = String(answer || "").replace(/\s+/g, "\\ ");
    
        // Construct the LaTeX string
        const latex = `\\(\\LARGE{
            ${formattedExpression} = ${formattedAnswer}
        }\\)`;
    
        // Update state safely
        setLatexExpression((prevLatexExpression) => [
            ...prevLatexExpression,
            latex
        ]);
    };
    
    
    
    


    const stopDrawing = () => {
        if (isDrawing) {
            saveHistory(); // Save canvas state after completing a drawing action
        }
        setIsDrawing(false);
    };
    
    const saveHistory = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const canvasState = canvas.toDataURL(); // Capture the current canvas state
            setHistory((prevHistory) => [...prevHistory, canvasState]); // Save to history
            setRedoStack([]); // Clear redo stack when new history is created
        }
    };
    
    
    const undo = () => {
        if (history.length > 1) { // Ensure there’s at least one state in history
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
    
            if (canvas && ctx) {
                const lastState = history[history.length - 1]; // Get the current state
                setRedoStack((prevRedoStack) => [lastState, ...prevRedoStack]); // Add to redo stack
    
                const newHistory = history.slice(0, -1); // Remove the last state from history
                setHistory(newHistory);
    
                const previousState = newHistory[newHistory.length - 1]; // Get the previous state
                const img = new Image();
                img.src = previousState; // Load the previous state
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                    ctx.drawImage(img, 0, 0); // Redraw the previous state
                };
            }
        }
    };
    
    
    const redo = () => {
        if (redoStack.length > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
    
            if (canvas && ctx) {
                const nextState = redoStack[0]; // Get the next state to redo
                setRedoStack((prevRedoStack) => prevRedoStack.slice(1)); // Remove it from the redo stack
                setHistory((prevHistory) => [...prevHistory, nextState]); // Add it to the history
    
                const img = new Image();
                img.src = nextState; // Load the next state
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                    ctx.drawImage(img, 0, 0); // Redraw the next state
                };
            }
        }
    };
    
    
    
    
    

    const saveCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'drawing.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    const loadCanvas = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
          Array.from(event.target.files).forEach((file) => {
            const reader = new FileReader();
      
            reader.onload = (e) => {
              const img = new Image();
              img.src = e.target?.result as string;
      
              img.onload = () => {
                setUploadedImages((prevImages) => [
                  ...prevImages,
                  {
                    id: `${Date.now()}-${Math.random()}`, // Unique ID for each image
                    image: img,
                    position: {
                      x: (window.innerWidth - img.width * 0.5) / 2, // Center horizontally
                      y: (window.innerHeight - img.height * 0.5) / 2, // Center vertically
                    },
                  },
                ]);
              };
            };
      
            reader.readAsDataURL(file);
          });
        }
      };
      
    
    

      const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          setHistory([]);
          setRedoStack([]);
          setUploadedImages([]); // Clear all uploaded images
        }
      };
      

      const startDrawing = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
      ) => {
        e.preventDefault();
      
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const { offsetX, offsetY } = getEventCoordinates(e, canvas);
            ctx.beginPath();
            ctx.moveTo(offsetX, offsetY);
            setIsDrawing(true);
          }
        }
      };
      
      const draw = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
      ) => {
        if (!isDrawing) {
          return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const { offsetX, offsetY } = getEventCoordinates(e, canvas);
            ctx.strokeStyle = isEraser ? 'black' : color;
            ctx.lineWidth = isEraser ? eraserSize : 3;
            ctx.lineTo(offsetX, offsetY);
            ctx.stroke();
          }
        }
      };
      
      const getEventCoordinates = (
        e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
        canvas: HTMLCanvasElement
      ) => {
        const rect = canvas.getBoundingClientRect(); // Get canvas position and dimensions
        if ('touches' in e) {
          // For touch events
          return {
            offsetX: e.touches[0].clientX - rect.left,
            offsetY: e.touches[0].clientY - rect.top,
          };
        } else {
          // For mouse events
          return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY,
          };
        }
      };
      
    

   

    const runRoute = async () => {
        const canvas = canvasRef.current;

        if (canvas) {
            const response = await axios({
                method: 'post',
                url: `${import.meta.env.VITE_API_URL}/calculate`,
                data: {
                    image: canvas.toDataURL('image/png'),
                    dict_of_vars: dictOfVars,
                },
            });

            const resp = await response.data;
            console.log("Backend response:", resp);
            resp.data.forEach((data: Response) => {
                if (data.assign === true) {
                    setDictOfVars({
                        ...dictOfVars,
                        [data.expr]: data.result,
                    });
                }
            });

            resp.data.forEach((data: Response) => {
                setTimeout(() => {
                    setResult({
                        expression: data.expr,
                        answer: data.result,
                    });
                }, 1000);
            });
        }
    };

    
    return (
        <div className="flex flex-col h-screen bg-black z-2">
            {showTools && (
                <div className="fixed top-0 left-0 w-full flex justify-between p-2 shadow-md z-50">
                    <Button
                        onClick={() => setReset(true)}
                        className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 border border-white rounded hover:bg-yellow-600"
                        title="Reset the canvas"
                    >
                        Reset
                    </Button>

                    <Button
                        onClick={runRoute}
                        className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 border border-white rounded hover:bg-yellow-600"
                        title="Calculate expressions"
                    >
                        Calculate
                    </Button>
                </div>
            )}

            <div className="relative flex flex-1 mt-12">
                {showTools && (
                    <div className="fixed left-2 top-16 flex flex-col items-center gap-4 p-2 rounded-md shadow-md z-50">
                        {SWATCHES.map((swatch) => (
                            <div
                                key={swatch}
                                className="w-6 h-6 rounded-full border-2 border-white cursor-pointer"
                                style={{ backgroundColor: swatch }}
                                title={`Set color to ${swatch}`}
                                onClick={() => {
                                    setIsEraser(false);
                                    setColor(swatch);
                                }}
                            />
                        ))}
                        <div className="flex flex-col items-center gap-2">
                            <FaEraser
                                size={24}
                                className={`cursor-pointer ${isEraser ? 'text-red-500' : 'text-white'}`}
                                title="Eraser"
                                onClick={() => setIsEraser(!isEraser)}
                            />
                            {isEraser && (
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    value={eraserSize}
                                    onChange={(e) => setEraserSize(Number(e.target.value))}
                                    className="w-24"
                                    title="Eraser size"
                                />
                            )}
                        </div>
                        <FaUndo
                            size={18}
                            className="cursor-pointer text-white"
                            title="Undo"
                            onClick={undo}
                        />
                        <FaRedo
                            size={18}
                            className="cursor-pointer text-white"
                            title="Redo"
                            onClick={redo}
                        />
                        <FaSave
                            size={18}
                            className="cursor-pointer text-white"
                            title="Save"
                            onClick={saveCanvas}
                        />
                        <label className="cursor-pointer text-white" title="Upload">
                            <FaUpload size={18} />
                            <input type="file" onChange={loadCanvas} className="hidden" />
                        </label>
                    </div>
                )}

                <div className="relative flex-1">
                    <FiTool
                        size={24}
                        className="fixed bottom-4 right-4 cursor-pointer text-white"
                        title="Hide Toolbar"
                        onClick={() => setShowTools(!showTools)}
                    />
                    <canvas
                        ref={canvasRef}
                        className="w-full h-full mt-4 bg-black"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseOut={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                     {uploadedImages.map(({ id, image, position }) => (
  <Draggable
    key={id}
    position={position}
    onStop={(_, data) =>
      setUploadedImages((prevImages) =>
        prevImages.map((img) =>
          img.id === id ? { ...img, position: { x: data.x, y: data.y } } : img
        )
      )
    }
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 100,
      }}
    >
      <img
        src={image.src}
        alt="Uploaded"
        style={{
          maxWidth: "50%",
          maxHeight: "50%",
        }}
      />
    </div>
  </Draggable>
))}

                    

                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 100,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: '10px',
                            borderRadius: '8px',
                        }}
                    >
                        {latexExpression.map((latex, index) => (
                            <Draggable key={index}>
                                <div
                                    className="absolute p-2 text-sm text-white shadow-md whitespace-pre"
                                    dangerouslySetInnerHTML={{ __html: latex }}
                                />
                            </Draggable>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
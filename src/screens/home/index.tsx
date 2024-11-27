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

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex])
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
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx && event.target.files?.[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) {
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = isEraser ? 'black' : color; // Eraser uses the canvas background color
                ctx.lineWidth = isEraser ? eraserSize : 3; // Apply eraser size
                ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
                ctx.stroke();
            }
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
        <div className="flex flex-col items-center justify-center h-screen bg-black">
            {showTools && (
                <div className="flex items-center justify-between w-full gap-4 p-2 bg-gray-800 rounded-md shadow-md">
                <Button
                    onClick={() => setReset(true)}
                    className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 border border-white rounded hover:bg-yellow-600"
                >
                    Reset
                </Button>
                <div className="flex items-center gap-4 flex-wrap">
                    {SWATCHES.map((swatch) => (
                        <div
                            key={swatch}
                            className="w-6 h-6 rounded-full border-2 border-white cursor-pointer"
                            style={{ backgroundColor: swatch }}
                            onClick={() => {
                                setIsEraser(false);
                                setColor(swatch);
                            }}
                        />
                    ))}
                    <div className="flex items-center gap-2">
                        <FaEraser
                            size={24}
                            className={`cursor-pointer ${
                                isEraser ? 'text-red-500' : 'text-white'
                            }`}
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
                            />
                        )}
                    </div>
                    <FaUndo size={18} className="cursor-pointer text-white" onClick={undo} />
                    <FaRedo size={18} className="cursor-pointer text-white" onClick={redo} />
                    <FaSave size={18} className="cursor-pointer text-white" onClick={saveCanvas} />
                    <label className="cursor-pointer text-white">
                        <FaUpload size={18} />
                        <input type="file" onChange={loadCanvas} className="hidden" />
                    </label>
                </div>
                <Button
                    onClick={runRoute}
                    className="px-4 py-2 text-sm font-bold text-black bg-yellow-500 border border-white rounded hover:bg-yellow-600"
                >
                    Calculate
                </Button>
            </div>
            
            )}
            <FiTool
                size={24}
                className="absolute bottom-4 right-4 cursor-pointer text-white"
                onClick={() => setShowTools(!showTools)}
            />
            <canvas
                ref={canvasRef}
                className="w-full h-full mt-4 bg-black"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
            />
            {latexExpression.map((latex, index) => (
                <Draggable key={index}>
                    <div
                        className="absolute p-2 text-sm text-white shadow-md whitespace-pre"
                        dangerouslySetInnerHTML={{ __html: latex }}
                    />
                </Draggable>
            ))}
        </div>
    );

    
}

import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import type { SdgDistributionDto } from "@/types/dashboard.types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BarChartProps {
    sdgData: SdgDistributionDto[] | null;
    title?: string;
}

const BarChart = ({ sdgData, title }: BarChartProps) => {
    if (!sdgData || sdgData.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex items-center justify-center h-80">
                <p className="text-gray-400 text-sm">No SDG data available</p>
            </div>
        );
    }

    const labels = sdgData.map((item) => item.sdgFocus);
    const counts = sdgData.map((item) => item.problemCount);

    const data = {
        labels,
        datasets: [
            {
                label: "Number of Problems",
                data: counts,
                backgroundColor: "rgba(20, 172, 65, 0.6)",
                borderColor: "rgb(0, 0, 0)",
                borderWidth: 1,
                borderRadius: 8,
                barPercentage: 0.7,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" as const },
            tooltip: {
                callbacks: {
                    label: (context: any) => `Problems: ${context.raw}`,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { precision: 0 },
                title: {
                    display: true,
                    text: "Number of Problems",
                    font: { weight: "bold" as const },
                },
                grid: { color: "#e0e0e0" },
            },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    autoSkip: true,
                },
            },
        },
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            {title && (
                <h3 className="text-center font-semibold text-gray-900 mb-4">{title}</h3>
            )}
            <div style={{ position: "relative", height: "500px" }}>
                <Bar data={data} options={options} />
            </div>
        </div>
    );
};

export default BarChart;
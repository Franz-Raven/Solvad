
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
    const labels = sdgData?.map((item) => item.sdgFocus) || [];
    const counts = sdgData?.map((item) => item.problemCount) || [];

    const data = {
        labels,
        datasets: [
            {
                label: "Number of Problems",
                data: counts,
                backgroundColor: "rgba(33, 150, 243, 0.6)",
                borderColor: "rgba(33, 150, 243, 1)",
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
                title: {
                    display: true,
                    text: "Number of Problems",
                    font: { weight: "bold" as const },
                },
                grid: { display: true, color: "#e0e0e0" },
            },
            x: {
                title: {
                    display: true,
                    text: "Sustainable Development Goals",
                    font: { weight: "bold" as const },
                },
                ticks: {
                    rotation: 45,
                    autoSkip: true,
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
        },
    };

    return (
        <div style={{ minHeight: "400px", width: "100%", padding: "1rem" }}>
            {title && <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>{title}</h3>}
            <Bar data={data} options={options} />
        </div>
    );
};

export default BarChart;
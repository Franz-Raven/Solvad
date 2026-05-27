import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { ProblemStatusGroupDto } from "@/types/dashboard.types";

ChartJS.register(ArcElement, Tooltip, Legend);

interface DonutChartProps {
    statusData: ProblemStatusGroupDto | null;
    title?: string;
}

const DonutChart = ({ statusData, title }: DonutChartProps) => {
    const data = {
        labels: ["Open", "Active", "Solved (Needs Improvement)", "Completed", "Closed"],
        datasets: [
            {
                data: statusData ? [
                    statusData.open,
                    statusData.active,
                    statusData.solvedNeedsImprovement,
                    statusData.completed,
                    statusData.closed
                ] : [0, 0, 0, 0, 0],
                backgroundColor: ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0", "#F44336"],
                borderWidth: 2,
                borderColor: "#fff",
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: { font: { size: 12 }, padding: 15 },
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.label || "";
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    },
                },
            },
        },
    };

    return (
<div style={{ height: "400px", width: "100%", padding: "1rem" }}>
            {title && <h3 style={{ textAlign: "center", marginBottom: "1rem" }}>{title}</h3>}
            <Doughnut data={data} options={options} />
        </div>
    );
};

export default DonutChart;
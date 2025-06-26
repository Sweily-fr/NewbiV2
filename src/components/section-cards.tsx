import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

const cards = [
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
  {
    title: "Crée et gerez vos factures",
    amount: "Factures",
    trend: "12.5%",
    trendIcon: <IconTrendingUp />,
    trendColor: "text-green-500",
    description: "Gérez vos factures en quelques clics",
  },
];
export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.amount}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.trendIcon}
                {card.trend}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.description}
            </div>
            <div className="text-muted-foreground">{card.description}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

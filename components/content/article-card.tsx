import { ArticleContent } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface ArticleCardProps {
  article: ArticleContent;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {article.coverImage ? (
        <div className="relative aspect-video overflow-hidden bg-slate-100">
          <img
            src={article.coverImage}
            alt={article.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <Badge className="absolute left-3 top-3 bg-blue-600 hover:bg-blue-700">
            Article
          </Badge>
        </div>
      ) : (
        <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
          <FileText className="h-20 w-20 text-blue-200" />
          <Badge className="absolute left-3 top-3 bg-blue-600 hover:bg-blue-700">
            Article
          </Badge>
        </div>
      )}
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="line-clamp-2 text-lg leading-snug">
          {article.title}
        </CardTitle>
        <div className="flex items-center justify-between text-sm">
          <CardDescription className="font-medium">{article.creator}</CardDescription>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {article.excerpt}
        </p>
      </CardContent>
    </Card>
  );
}

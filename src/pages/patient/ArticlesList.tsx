import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { articleService } from '@/services/ArticleService';
import { Article } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Clock, Tag, UserCircle } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import { formatDistanceToNow } from 'date-fns';

const PageContainer = styled.div`
  background: linear-gradient(135deg, #004953 0%, #006064 50%, #00363a 100%);
  min-height: 100vh;
  color: white;
  font-family: 'Roboto', sans-serif;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  margin-right: 15px;
  cursor: pointer;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
`;

const ContentGrid = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const ArticleCardStyled = styled(Card)`
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-top-left-radius: var(--radius);
  border-top-right-radius: var(--radius);
`;

const CardTitleStyled = styled(CardTitle)`
  color: white;
  font-size: 1.125rem; // Equivalent to text-lg
  margin-bottom: 0.5rem; // Equivalent to mb-2
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.8rem; // Equivalent to text-xs
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.75rem; // Equivalent to mb-3
  gap: 0.75rem; // Equivalent to space-x-3
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem; // Equivalent to space-x-1
`;

const ArticleSnippet = styled.p`
  font-size: 0.875rem; // Equivalent to text-sm
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  flex-grow: 1; // Allows card footer to be at the bottom
  margin-bottom: 1rem; // Equivalent to mb-4
`;

const TagsContainer = styled.div`
  margin-top: auto; // Pushes tags to the bottom if CardFooter is not used like this
  padding-bottom: 1rem; // Add padding if CardFooter is removed or repurposed
`;


const ArticlesList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const fetchedArticles = await articleService.getArticles();
        // Simple snippet generation for display
        const articlesWithSnippets = fetchedArticles.map(article => ({
          ...article,
          content: article.content.substring(0, 120) + (article.content.length > 120 ? '...' : '')
        }));
        setArticles(articlesWithSnippets);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
        // Handle error (e.g., show a toast message)
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate(-1)}><ChevronLeft size={24} /></BackButton>
          <PageTitle>Health Articles</PageTitle>
        </Header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C389]"></div>
        </div>
        <BottomNavigation />
      </PageContainer>
    );
  }

  if (articles.length === 0) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate(-1)}><ChevronLeft size={24} /></BackButton>
          <PageTitle>Health Articles</PageTitle>
        </Header>
        <div className="flex flex-1 items-center justify-center text-center px-4">
            <p>No health articles available at the moment. Please check back later.</p>
        </div>
        <BottomNavigation />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate(-1)}><ChevronLeft size={24} /></BackButton>
        <PageTitle>Health Articles</PageTitle>
      </Header>
      <ContentGrid>
        {articles.map((article) => (
          <ArticleCardStyled key={article.id} onClick={() => navigate(`/patient/articles/${article.slug}`)}>
            {article.image_url && <CardImage src={article.image_url} alt={article.title} />}
            <CardHeader>
              <CardTitleStyled>{article.title}</CardTitleStyled>
              <CardMeta>
                <MetaItem>
                  {article.author?.profile_pic_url ? (
                    <Avatar className="h-5 w-5 mr-1">
                      <AvatarImage src={article.author.profile_pic_url} alt={article.author_name || 'Author'} />
                      <AvatarFallback>{(article.author_name || 'A').charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : <UserCircle size={14} className="mr-1" />}
                  {article.author_name || article.author?.full_name || 'Kabiraj Team'}
                </MetaItem>
                <MetaItem>
                  <Clock size={14} />
                  {article.estimated_read_time ? `${article.estimated_read_time} min read` : formatDistanceToNow(new Date(article.published_at), { addSuffix: true })}
                </MetaItem>
              </CardMeta>
            </CardHeader>
            <CardContent>
              <ArticleSnippet>{article.content}</ArticleSnippet>
            </CardContent>
            {article.tags && article.tags.length > 0 && (
              <CardFooter className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                    <Tag size={12} className="mr-1" />{tag}
                  </Badge>
                ))}
              </CardFooter>
            )}
          </ArticleCardStyled>
        ))}
      </ContentGrid>
      <BottomNavigation />
    </PageContainer>
  );
};

export default ArticlesList;

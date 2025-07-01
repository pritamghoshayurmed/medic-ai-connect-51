import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { articleService } from '@/services/ArticleService';
import { Article } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Clock, Tag, UserCircle, CalendarDays } from 'lucide-react';
import BottomNavigation from '@/components/BottomNavigation';
import MarkdownRenderer from '@/components/MarkdownRenderer'; // Assuming this component exists
import { format } from 'date-fns';

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
  position: sticky;
  top: 0;
  background: linear-gradient(135deg, #004953CC 0%, #006064CC 50%, #00363aCC 100%); // Slightly transparent
  backdrop-filter: blur(5px);
  z-index: 10;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  margin-right: 15px;
  cursor: pointer;
`;

const PageTitle = styled.h1`
  font-size: 1.25rem; // text-xl
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-width: 800px; // Typical max width for readability
  margin: 0 auto; // Center content
`;

const ArticleHeaderImage = styled.img`
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 2rem;
`;

const ArticleTitle = styled.h1`
  font-size: 2.5rem; // text-4xl
  font-weight: 700; // font-bold
  margin-bottom: 1rem;
  line-height: 1.2;
`;

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem; // space-x-4 and space-y-2 for wrap
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
  font-size: 0.875rem; // text-sm
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.375rem; // space-x-1.5
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem; // space-x-2
  margin-top: 1.5rem;
  margin-bottom: 2rem;
`;

const ArticleBody = styled.div`
  line-height: 1.7;
  font-size: 1rem; // text-base or md:text-lg
  color: rgba(255, 255, 255, 0.95);

  h1, h2, h3, h4, h5, h6 {
    color: white;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    line-height: 1.3;
  }
  h1 { font-size: 1.875rem; } // text-3xl
  h2 { font-size: 1.5rem; }   // text-2xl
  h3 { font-size: 1.25rem; }  // text-xl
  p { margin-bottom: 1em; }
  a {
    color: #00C389; // Kabiraj accent color
    text-decoration: underline;
    &:hover {
      color: #00A070;
    }
  }
  ul, ol {
    margin-left: 1.5em;
    margin-bottom: 1em;
  }
  li { margin-bottom: 0.25em; }
  blockquote {
    border-left: 3px solid #00C389;
    padding-left: 1em;
    margin-left: 0;
    font-style: italic;
    color: rgba(255, 255, 255, 0.8);
  }
  code {
    background-color: rgba(0,0,0,0.2);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }
  pre {
    background-color: rgba(0,0,0,0.2);
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;
  }
`;


const ArticleView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) {
      navigate('/patient/articles'); // Or a 404 page
      return;
    }

    const fetchArticle = async () => {
      setLoading(true);
      try {
        const fetchedArticle = await articleService.getArticleBySlug(slug);
        setArticle(fetchedArticle);
        if (!fetchedArticle) {
          // Handle article not found (e.g., show a message or redirect)
          console.warn("Article not found for slug:", slug);
        }
      } catch (error) {
        console.error("Failed to fetch article:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug, navigate]);

  if (loading) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate('/patient/articles')}><ChevronLeft size={24} /></BackButton>
          <PageTitle>Loading Article...</PageTitle>
        </Header>
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00C389]"></div>
        </div>
        <BottomNavigation />
      </PageContainer>
    );
  }

  if (!article) {
    return (
      <PageContainer>
        <Header>
          <BackButton onClick={() => navigate('/patient/articles')}><ChevronLeft size={24} /></BackButton>
          <PageTitle>Article Not Found</PageTitle>
        </Header>
        <div className="flex flex-1 items-center justify-center text-center px-4">
          <p>The article you are looking for could not be found or is not available.</p>
        </div>
        <BottomNavigation />
      </PageContainer>
    );
  }

  const authorDisplayName = article.author?.full_name || article.author_name || 'Kabiraj Health Team';

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/patient/articles')}><ChevronLeft size={24} /></BackButton>
        <PageTitle>{article.title}</PageTitle>
      </Header>
      <ContentArea>
        {article.image_url && <ArticleHeaderImage src={article.image_url} alt={article.title} />}
        <ArticleTitle>{article.title}</ArticleTitle>
        <MetaInfo>
          <MetaItem>
            {article.author?.profile_pic_url ? (
              <Avatar className="h-6 w-6 mr-1.5">
                <AvatarImage src={article.author.profile_pic_url} alt={authorDisplayName} />
                <AvatarFallback>{authorDisplayName.charAt(0)}</AvatarFallback>
              </Avatar>
            ) : <UserCircle size={16} className="mr-1.5" />}
            {authorDisplayName}
          </MetaItem>
          <MetaItem>
            <CalendarDays size={16} />
            {format(new Date(article.published_at), 'MMMM d, yyyy')}
          </MetaItem>
          {article.estimated_read_time && (
            <MetaItem>
              <Clock size={16} />
              {`${article.estimated_read_time} min read`}
            </MetaItem>
          )}
        </MetaInfo>

        {article.tags && article.tags.length > 0 && (
          <TagsContainer>
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                <Tag size={12} className="mr-1" />{tag}
              </Badge>
            ))}
          </TagsContainer>
        )}

        <ArticleBody>
          <MarkdownRenderer content={article.content} />
        </ArticleBody>

      </ContentArea>
      <BottomNavigation />
    </PageContainer>
  );
};

export default ArticleView;

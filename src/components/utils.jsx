export const createPageUrl = (pageName) => {
  if (!pageName || pageName === 'Home') return '/';
  
  if (pageName.includes('?')) {
    const [path, query] = pageName.split('?');
    return `/${path}?${query}`;
  }
  
  return `/${pageName}`;
};
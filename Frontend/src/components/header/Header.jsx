import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Badge,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import { 
  Menu as MenuIcon, 
  ShoppingCart, 
  Close,
  ChevronRight
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { useLanguage } from '../../hooks/useLanguage';
import logo from "../../assets/logo/toufikcalisthenicsLogo.png";
import { motion, AnimatePresence } from "framer-motion";
import LanguageSwitcher from '../LanguageSwitcher';

const navigationItems = [
  { key: "header.home", href: "/" },
  { key: "header.shop", href: "/shop" },
  { key: "header.guides", href: "/guides" },
  { key: "header.programs", href: "/programs" },
  { key: "header.calorieCalculator", href: "/calorie-calculator" },
  { key: "header.contact", href: "/about-me" },
  { key: "header.feedback", href: "/feedback" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href) => {
    setMobileMenuOpen(false);
    window.location.href = href;
  };

  const isActive = (href) => {
    if (href === '/' && location.pathname === '/') return true;
    if (href !== '/' && location.pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: scrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          color: "text.primary",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          py: scrolled ? 0.5 : 1.5,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            {/* Logo Section */}
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", textDecoration: "none" }}
              onClick={() => handleNavClick("/")}
            >
              <Box
                component="span"
                sx={{
                  width: { xs: 52, sm: 56, md: 64 },
                  height: { xs: 52, sm: 56, md: 64 },
                  flexShrink: 0,
                  overflow: "hidden",
                  backgroundColor: "transparent",
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.03)" }
                }}
              >
                <img
                  src={logo}
                  alt="Toufik | calisthenics"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "transparent" }}
                />
              </Box>
              <Typography
                variant="h6"
                component="span"
                sx={{
                  fontFamily: "'Oswald', 'Inter', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  fontSize: { xs: "1.2rem", sm: "1.35rem", md: "1.55rem" },
                  display: { xs: "none", sm: "block" },
                  color: "#111",
                  "& .accent": { color: "#EAB308", fontWeight: 600 }
                }}
              >
                Toufik<span className="accent"> | calisthenics</span>
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
              {navigationItems.map((item) => (
                <Button
                  key={item.key}
                  onClick={() => handleNavClick(item.href)}
                  sx={{
                    px: 2,
                    py: 1,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: isActive(item.href) ? "black" : "gray.600",
                    position: "relative",
                    "&:hover": { color: "black", backgroundColor: "transparent" },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 8,
                      left: "50%",
                      width: isActive(item.href) ? "20px" : "0%",
                      height: "2.5px",
                      backgroundColor: "#FFD700",
                      transition: "all 0.3s ease",
                      transform: "translateX(-50%)",
                      borderRadius: "2px"
                    },
                    "&:hover::after": { width: "20px" }
                  }}
                >
                  {t(item.key)}
                </Button>
              ))}
            </Box>

            {/* Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 2 } }}>
              <LanguageSwitcher />
              
              <IconButton
                onClick={() => handleNavClick("/cart")}
                sx={{
                  color: "black",
                  backgroundColor: "rgba(0,0,0,0.03)",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" }
                }}
              >
                <Badge
                  badgeContent={totalItems}
                  sx={{
                    "& .MuiBadge-badge": {
                      background: "#FFD700",
                      color: "black",
                      fontWeight: 900,
                      fontSize: "0.65rem",
                      minWidth: "18px",
                      height: "18px",
                      border: "2px solid white"
                    },
                  }}
                >
                  <ShoppingCart sx={{ fontSize: "1.4rem" }} />
                </Badge>
              </IconButton>

              <Button
                variant="contained"
                onClick={() => handleNavClick("/shop")}
                sx={{
                  display: { xs: "none", sm: "flex" },
                  bgcolor: "black",
                  color: "#FFD700",
                  fontWeight: 800,
                  px: 3,
                  borderRadius: "50px",
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  "&:hover": {
                    bgcolor: "#1a1a1a",
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.2)"
                  },
                  transition: "all 0.3s ease"
                }}
              >
                {t('home.shopNow')}
              </Button>

              {/* Mobile Toggle */}
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                sx={{
                  display: { xs: "flex", md: "none" },
                  color: "black",
                  ml: 0.5,
                  p: 1.2,
                  bgcolor: "rgba(0,0,0,0.04)",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.08)" }
                }}
              >
                <MenuIcon sx={{ fontSize: "1.6rem" }} />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>


      {/* Mobile Drawer Navigation */}
      <Drawer
        anchor={isRtl ? "right" : "left"}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: "320px",
            bgcolor: "white",
            backgroundImage: "linear-gradient(to bottom, #fff, #f9fafb)",
          }
        }}
      >
        <Box sx={{ p: 3, h: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  overflow: "hidden",
                  flexShrink: 0,
                  backgroundColor: "transparent"
                }}
              >
                <img src={logo} alt="Toufik | calisthenics" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", background: "transparent" }} />
              </Box>
              <Typography variant="h6" sx={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700 }} color="#111">Toufik<span style={{ color: "#EAB308" }}> | calisthenics</span></Typography>
            </Box>
            <IconButton onClick={() => setMobileMenuOpen(false)} sx={{ bgcolor: "rgba(0,0,0,0.05)" }}>
              <Close />
            </IconButton>
          </Box>

          <List sx={{ flex: 1 }}>
            {navigationItems.map((item) => (
              <ListItem key={item.key} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => handleNavClick(item.href)}
                  sx={{
                    borderRadius: "12px",
                    py: 2,
                    bgcolor: isActive(item.href) ? "rgba(255, 215, 0, 0.1)" : "transparent",
                    color: isActive(item.href) ? "black" : "text.secondary",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.03)" }
                  }}
                >
                  <ListItemText
                    primary={t(item.key)}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.href) ? 800 : 600,
                      fontSize: "1.1rem"
                    }}
                  />
                  <ChevronRight sx={{ opacity: 0.3, transform: isRtl ? "rotate(180deg)" : "none" }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 3, opacity: 0.6 }} />

          <Box sx={{ mt: "auto", pb: 2 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => handleNavClick("/shop")}
              sx={{
                bgcolor: "black",
                color: "#FFD700",
                py: 2,
                borderRadius: "16px",
                fontWeight: 800,
                fontSize: "1.1rem",
                textTransform: "none",
                boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                mb: 2
              }}
            >
              {t('home.shopNow')}
            </Button>
            <Typography variant="caption" textAlign="center" display="block" color="text.secondary">
              © {new Date().getFullYear()} Toufik | calisthenics. {t('footer.rights')}
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}